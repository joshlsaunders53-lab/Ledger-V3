import type { Trade, TradingSession } from "./types";
import { computeRiskUnit, todayStr, toLocalDateStr } from "./calculations";

function isClean(t: Trade) {
  return t.followedPlan !== false;
}

export interface DashboardTopMetrics {
  accountBalance: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  totalPnl: number;
  winRate: number | null;
  profitFactor: number | null;
  profitFactorInfinite: boolean;
  avgRR: number | null;
  expectancy: number | null;
  avgWinner: number;
  avgLoser: number;
  largestWin: number;
  largestLoss: number;
  currentStreak: { count: number; direction: "win" | "loss" | null };
  longestWinStreak: number;
  longestLossStreak: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  disciplineScore: number | null;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setDate(d.getDate() - d.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function computeTopMetrics(
  trades: Trade[],
  startingBalance: number
): DashboardTopMetrics {
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const today = todayStr();
  const weekStart = toLocalDateStr(startOfWeek(new Date()));
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const dailyPnl = trades.filter((t) => t.date === today).reduce((s, t) => s + t.pnl, 0);
  const weeklyPnl = trades.filter((t) => t.date >= weekStart).reduce((s, t) => s + t.pnl, 0);
  const monthlyPnl = trades
    .filter((t) => t.date.startsWith(monthPrefix))
    .reduce((s, t) => s + t.pnl, 0);

  const winners = trades.filter((t) => t.pnl > 0);
  const losers = trades.filter((t) => t.pnl < 0);
  const breakeven = trades.filter((t) => t.pnl === 0);

  const winRate = trades.length ? Math.round((winners.length / trades.length) * 100) : null;
  const grossWin = winners.reduce((s, t) => s + t.pnl, 0);
  const grossLossAbs = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));
  const profitFactorInfinite = winners.length > 0 && grossLossAbs === 0;
  const profitFactor = trades.length === 0 ? null : profitFactorInfinite ? null : grossWin / grossLossAbs;

  const avgWinner = winners.length ? grossWin / winners.length : 0;
  const avgLoser = losers.length ? losers.reduce((s, t) => s + t.pnl, 0) / losers.length : 0;

  const riskUnit = computeRiskUnit(trades);
  const avgRR = trades.length && riskUnit ? trades.reduce((s, t) => s + t.pnl / riskUnit, 0) / trades.length : null;

  const winP = trades.length ? winners.length / trades.length : 0;
  const lossP = trades.length ? losers.length / trades.length : 0;
  const expectancy = trades.length ? winP * avgWinner + lossP * avgLoser : null;

  const largestWin = winners.length ? Math.max(...winners.map((t) => t.pnl)) : 0;
  const largestLoss = losers.length ? Math.min(...losers.map((t) => t.pnl)) : 0;

  const chrono = [...trades].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.createdAt ?? "").localeCompare(b.createdAt ?? "")
  );
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let runCount = 0;
  let runDir: "win" | "loss" | null = null;
  for (const t of chrono) {
    const dir: "win" | "loss" | null = t.pnl > 0 ? "win" : t.pnl < 0 ? "loss" : null;
    if (dir === null) {
      runDir = null;
      runCount = 0;
      continue;
    }
    if (dir === runDir) {
      runCount++;
    } else {
      runDir = dir;
      runCount = 1;
    }
    if (dir === "win") longestWinStreak = Math.max(longestWinStreak, runCount);
    else longestLossStreak = Math.max(longestLossStreak, runCount);
  }

  const desc = [...chrono].reverse();
  let curCount = 0;
  let curDir: "win" | "loss" | null = null;
  for (const t of desc) {
    const dir: "win" | "loss" | null = t.pnl > 0 ? "win" : t.pnl < 0 ? "loss" : null;
    if (dir === null) break;
    if (curDir === null) curDir = dir;
    if (dir !== curDir) break;
    curCount++;
  }

  const clean = trades.filter(isClean);
  const disciplineScore = trades.length ? Math.round((clean.length / trades.length) * 100) : null;

  return {
    accountBalance: startingBalance + totalPnl,
    dailyPnl,
    weeklyPnl,
    monthlyPnl,
    totalPnl,
    winRate,
    profitFactor,
    profitFactorInfinite,
    avgRR,
    expectancy,
    avgWinner,
    avgLoser,
    largestWin,
    largestLoss,
    currentStreak: { count: curCount, direction: curCount === 0 ? null : curDir },
    longestWinStreak,
    longestLossStreak,
    totalTrades: trades.length,
    winningTrades: winners.length,
    losingTrades: losers.length,
    breakevenTrades: breakeven.length,
    disciplineScore,
  };
}

export function computeMonthlyPerformance(trades: Trade[]) {
  const byMonth: Record<string, number> = {};
  trades.forEach((t) => {
    const key = t.date.slice(0, 7);
    byMonth[key] = (byMonth[key] || 0) + t.pnl;
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({ month, pnl }));
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function computeWeekdayPerformance(trades: Trade[]) {
  const totals = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  trades.forEach((t) => {
    const day = new Date(t.date + "T00:00:00Z").getUTCDay();
    totals[day] += t.pnl;
    counts[day] += 1;
  });
  return WEEKDAY_LABELS.map((label, i) => ({
    label,
    pnl: totals[i],
    trades: counts[i],
  }));
}

type SessionBucket = "Asia" | "London" | "New York" | "Other";
function bucketForHourUTC(hour: number): SessionBucket {
  if (hour >= 0 && hour < 8) return "Asia";
  if (hour >= 8 && hour < 13) return "London";
  if (hour >= 13 && hour < 21) return "New York";
  return "Other";
}
export function computeSessionOfDayPerformance(trades: Trade[]) {
  const withTimestamp = trades.filter((t) => t.createdAt);
  const buckets: Record<SessionBucket, { pnl: number; count: number }> = {
    Asia: { pnl: 0, count: 0 },
    London: { pnl: 0, count: 0 },
    "New York": { pnl: 0, count: 0 },
    Other: { pnl: 0, count: 0 },
  };
  withTimestamp.forEach((t) => {
    const hour = new Date(t.createdAt!).getUTCHours();
    const bucket = bucketForHourUTC(hour);
    buckets[bucket].pnl += t.pnl;
    buckets[bucket].count += 1;
  });
  return {
    hasData: withTimestamp.length > 0,
    rows: (Object.entries(buckets) as [SessionBucket, { pnl: number; count: number }][])
      .filter(([, v]) => v.count > 0)
      .map(([label, v]) => ({ label, pnl: v.pnl, trades: v.count })),
  };
}

export function computeSetupPerformance(trades: Trade[]) {
  const withSetup = trades.filter((t) => t.setup);
  const bySetup: Record<string, { pnl: number; count: number; wins: number }> = {};
  withSetup.forEach((t) => {
    const s = (bySetup[t.setup] ??= { pnl: 0, count: 0, wins: 0 });
    s.pnl += t.pnl;
    s.count += 1;
    if (t.pnl > 0) s.wins += 1;
  });
  const rows = Object.entries(bySetup)
    .map(([label, v]) => ({
      label,
      pnl: v.pnl,
      trades: v.count,
      winRate: Math.round((v.wins / v.count) * 100),
    }))
    .sort((a, b) => b.pnl - a.pnl);
  return { hasData: withSetup.length > 0, rows };
}

export function computeSleepStressCorrelation(trades: Trade[], sessions: TradingSession[]) {
  const byDate: Record<string, number> = {};
  trades.forEach((t) => (byDate[t.date] = (byDate[t.date] || 0) + t.pnl));

  const points = sessions
    .filter((s) => byDate[s.date] !== undefined)
    .map((s) => ({
      date: s.date,
      sleep: s.preTrade.sleep,
      stress: s.preTrade.stress,
      pnl: byDate[s.date],
    }));

  return { hasData: points.length >= 3, points };
}

export function computeDisciplineMetrics(trades: Trade[]) {
  const clean = trades.filter(isClean);
  const broken = trades.filter((t) => !isClean(t));
  const mistakeCounts: Record<string, number> = {};
  trades.forEach((t) => t.mistakes.forEach((m) => (mistakeCounts[m] = (mistakeCounts[m] || 0) + 1)));
  const mostCommonMistake =
    Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const winners = trades.filter((t) => t.pnl > 0);
  const winnersFollowedPlan = winners.filter(isClean);
  const winningBehaviourPct = winners.length
    ? Math.round((winnersFollowedPlan.length / winners.length) * 100)
    : null;

  return {
    ruleFollowingPct: trades.length ? Math.round((clean.length / trades.length) * 100) : null,
    rulesBrokenCount: broken.length,
    mostCommonMistake,
    winningBehaviourPct,
  };
}
