import type { Trade, TradingSession } from "./types";
import { computeRiskUnit, toLocalDateStr } from "./calculations";

/** A trade counts as "clean" using the same definition as the Dashboard's
 * discipline gauge: no logged mistakes, no broken rules. Trades saved from
 * the new Add Trade modal already write "Broke trading plan" into
 * `mistakes` when the plan wasn't followed, so this one definition covers
 * both old and new trades without needing a separate followedPlan check. */
function isClean(t: Trade) {
  return t.mistakes.length === 0 && t.rulesBroken.length === 0;
}

export interface DayStats {
  date: string;
  trades: Trade[];
  pnl: number;
  tradeCount: number;
  winRate: number;
  avgR: number | null;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  disciplineScore: number | null;
  psychologyRating: number | null;
  rulesFollowed: number;
  rulesBroken: number;
  session: TradingSession | null;
}

export function computeDayStats(
  date: string,
  allTrades: Trade[],
  allSessions: TradingSession[],
  riskUnit: number
): DayStats {
  const trades = allTrades.filter((t) => t.date === date);
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0);
  const clean = trades.filter(isClean);
  const session = allSessions.find((s) => s.date === date) ?? null;

  return {
    date,
    trades,
    pnl,
    tradeCount: trades.length,
    winRate: trades.length ? Math.round((wins.length / trades.length) * 100) : 0,
    avgR:
      trades.length && riskUnit
        ? trades.reduce((s, t) => s + t.pnl / riskUnit, 0) / trades.length
        : null,
    bestTrade: trades.length
      ? [...trades].sort((a, b) => b.pnl - a.pnl)[0]
      : null,
    worstTrade: trades.length
      ? [...trades].sort((a, b) => a.pnl - b.pnl)[0]
      : null,
    disciplineScore: trades.length
      ? Math.round((clean.length / trades.length) * 100)
      : null,
    psychologyRating: session?.preTrade.confidence ?? null,
    rulesFollowed: clean.length,
    rulesBroken: trades.length - clean.length,
    session,
  };
}

/** All calendar cells for a month, Sun-first, including lead/trail days
 * from adjacent months so the grid is always a clean 7-column rectangle. */
export function computeMonthCalendar(
  year: number,
  month: number, // 0-indexed
  allTrades: Trade[],
  allSessions: TradingSession[]
): { date: string; inMonth: boolean; stats: DayStats }[] {
  const riskUnit = computeRiskUnit(allTrades);
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startDay = firstOfMonth.getUTCDay(); // 0 = Sun
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: { date: string; inMonth: boolean; stats: DayStats }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const date = new Date(Date.UTC(year, month - 1, d)).toISOString().slice(0, 10);
    cells.push({ date, inMonth: false, stats: computeDayStats(date, allTrades, allSessions, riskUnit) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(Date.UTC(year, month, d)).toISOString().slice(0, 10);
    cells.push({ date, inMonth: true, stats: computeDayStats(date, allTrades, allSessions, riskUnit) });
  }
  let trailDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(Date.UTC(year, month + 1, trailDay)).toISOString().slice(0, 10);
    cells.push({ date, inMonth: false, stats: computeDayStats(date, allTrades, allSessions, riskUnit) });
    trailDay++;
  }
  return cells;
}

export interface WeeklySummary {
  pnl: number;
  winRate: number;
  avgR: number | null;
  totalTrades: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  disciplinePct: number | null;
  consistencyScore: number | null;
}

/** Returns the 7 ISO dates (Sun-Sat) for the week containing `anchorDate`. */
export function getWeekDates(anchorDate: Date): string[] {
  const day = anchorDate.getDay();
  const sunday = new Date(anchorDate);
  sunday.setDate(anchorDate.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return toLocalDateStr(d);
  });
}

export function computeWeeklySummary(
  weekDates: string[],
  allTrades: Trade[],
  allSessions: TradingSession[]
): WeeklySummary {
  const riskUnit = computeRiskUnit(allTrades);
  const days = weekDates.map((d) => computeDayStats(d, allTrades, allSessions, riskUnit));
  const tradingDays = days.filter((d) => d.tradeCount > 0);
  const allWeekTrades = days.flatMap((d) => d.trades);

  if (allWeekTrades.length === 0) {
    return {
      pnl: 0,
      winRate: 0,
      avgR: null,
      totalTrades: 0,
      bestDay: null,
      worstDay: null,
      disciplinePct: null,
      consistencyScore: null,
    };
  }

  const pnl = allWeekTrades.reduce((s, t) => s + t.pnl, 0);
  const wins = allWeekTrades.filter((t) => t.pnl > 0);
  const clean = allWeekTrades.filter(isClean);
  const byDayPnl = tradingDays.map((d) => ({ date: d.date, pnl: d.pnl }));
  const disciplinedDays = tradingDays.filter(
    (d) => (d.disciplineScore ?? 0) >= 80
  ).length;

  return {
    pnl,
    winRate: Math.round((wins.length / allWeekTrades.length) * 100),
    avgR: riskUnit
      ? allWeekTrades.reduce((s, t) => s + t.pnl / riskUnit, 0) / allWeekTrades.length
      : null,
    totalTrades: allWeekTrades.length,
    bestDay: byDayPnl.length ? [...byDayPnl].sort((a, b) => b.pnl - a.pnl)[0] : null,
    worstDay: byDayPnl.length ? [...byDayPnl].sort((a, b) => a.pnl - b.pnl)[0] : null,
    disciplinePct: Math.round((clean.length / allWeekTrades.length) * 100),
    // Simple heuristic, not a statistical measure: the share of trading
    // days this week that stayed at/above an 80% discipline score.
    consistencyScore: tradingDays.length
      ? Math.round((disciplinedDays / tradingDays.length) * 100)
      : null,
  };
}

export interface MonthlySummary {
  pnl: number;
  totalTrades: number;
  winRate: number;
  avgR: number | null;
  profitFactor: number | null;
  largestWin: number;
  largestLoss: number;
  bestSetup: { label: string; avgPnl: number } | null;
  worstSetup: { label: string; avgPnl: number } | null;
  mostCommonEmotion: string | null;
  rulesBrokenCount: number;
  disciplineScore: number | null;
}

export function computeMonthlySummary(monthTrades: Trade[]): MonthlySummary {
  if (monthTrades.length === 0) {
    return {
      pnl: 0,
      totalTrades: 0,
      winRate: 0,
      avgR: null,
      profitFactor: null,
      largestWin: 0,
      largestLoss: 0,
      bestSetup: null,
      worstSetup: null,
      mostCommonEmotion: null,
      rulesBrokenCount: 0,
      disciplineScore: null,
    };
  }

  const riskUnit = computeRiskUnit(monthTrades);
  const pnl = monthTrades.reduce((s, t) => s + t.pnl, 0);
  const wins = monthTrades.filter((t) => t.pnl > 0);
  const losses = monthTrades.filter((t) => t.pnl < 0);
  const clean = monthTrades.filter(isClean);

  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLossAbs = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  const bySetup: Record<string, number[]> = {};
  monthTrades.forEach((t) => {
    if (!t.setup) return;
    (bySetup[t.setup] ??= []).push(t.pnl);
  });
  const setupAverages = Object.entries(bySetup).map(([label, arr]) => ({
    label,
    avgPnl: arr.reduce((s, v) => s + v, 0) / arr.length,
  }));
  const sortedSetups = [...setupAverages].sort((a, b) => b.avgPnl - a.avgPnl);

  const emotionCounts: Record<string, number> = {};
  monthTrades.forEach((t) =>
    t.emotions.forEach((e) => (emotionCounts[e] = (emotionCounts[e] || 0) + 1))
  );
  const mostCommonEmotion =
    Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    pnl,
    totalTrades: monthTrades.length,
    winRate: Math.round((wins.length / monthTrades.length) * 100),
    avgR: riskUnit
      ? monthTrades.reduce((s, t) => s + t.pnl / riskUnit, 0) / monthTrades.length
      : null,
    profitFactor: grossLossAbs === 0 ? null : grossWin / grossLossAbs,
    largestWin: wins.length ? Math.max(...wins.map((t) => t.pnl)) : 0,
    largestLoss: losses.length ? Math.min(...losses.map((t) => t.pnl)) : 0,
    bestSetup: sortedSetups[0] ?? null,
    worstSetup: sortedSetups.length > 1 ? sortedSetups[sortedSetups.length - 1] : null,
    mostCommonEmotion,
    rulesBrokenCount: monthTrades.length - clean.length,
    disciplineScore: Math.round((clean.length / monthTrades.length) * 100),
  };
}

// ---- Chart data builders (all scoped to the trades passed in) ----

export function chartDailyCumulativePnl(monthTrades: Trade[]) {
  const byDate: Record<string, number> = {};
  monthTrades.forEach((t) => (byDate[t.date] = (byDate[t.date] || 0) + t.pnl));
  const dates = Object.keys(byDate).sort();
  let cum = 0;
  return dates.map((date) => {
    cum += byDate[date];
    return { date: date.slice(5), cumulative: cum };
  });
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function chartPnlByWeekday(monthTrades: Trade[]) {
  const totals = new Array(7).fill(0);
  monthTrades.forEach((t) => {
    const day = new Date(t.date + "T00:00:00Z").getUTCDay();
    totals[day] += t.pnl;
  });
  return WEEKDAY_LABELS.map((label, i) => ({ label, pnl: totals[i] }));
}

export function chartWinRateOverTime(monthTrades: Trade[]) {
  const sorted = [...monthTrades].sort((a, b) => a.date.localeCompare(b.date));
  let wins = 0;
  return sorted.map((t, i) => {
    if (t.pnl > 0) wins++;
    return { date: t.date.slice(5), winRate: Math.round((wins / (i + 1)) * 100) };
  });
}

export function chartSetupsPerformance(monthTrades: Trade[]) {
  const bySetup: Record<string, number> = {};
  monthTrades.forEach((t) => {
    if (!t.setup) return;
    bySetup[t.setup] = (bySetup[t.setup] || 0) + t.pnl;
  });
  return Object.entries(bySetup)
    .map(([label, pnl]) => ({ label, pnl }))
    .sort((a, b) => b.pnl - a.pnl);
}

export function chartEmotionsVsProfitability(monthTrades: Trade[]) {
  const byEmotion: Record<string, number[]> = {};
  monthTrades.forEach((t) =>
    t.emotions.forEach((e) => (byEmotion[e] ??= []).push(t.pnl))
  );
  return Object.entries(byEmotion)
    .map(([label, arr]) => ({
      label,
      avgPnl: arr.reduce((s, v) => s + v, 0) / arr.length,
    }))
    .sort((a, b) => b.avgPnl - a.avgPnl);
}

export function chartDisciplineTrend(monthTrades: Trade[]) {
  const byDate: Record<string, Trade[]> = {};
  monthTrades.forEach((t) => (byDate[t.date] ??= []).push(t));
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, trades]) => ({
      date: date.slice(5),
      discipline: Math.round(
        (trades.filter(isClean).length / trades.length) * 100
      ),
    }));
}
