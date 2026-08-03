import type { Trade, LedgerState } from "./types";

/** Formats a number as signed currency, e.g. -$120.00 */
export function fmtMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  return (
    sign +
    "$" +
    Math.abs(n).toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })
  );
}

/** Formats a delta with an explicit leading + for positive values. */
export function fmtDelta(n: number): string {
  if (n > 0) return "+" + fmtMoney(n);
  if (n < 0) return fmtMoney(n);
  return fmtMoney(0);
}

/** Compact currency for chart axis labels, e.g. -$120 */
export function fmtShort(n: number): string {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.round(Math.abs(n)).toLocaleString();
}

/** Formats a Date as YYYY-MM-DD using LOCAL calendar fields — never UTC.
 * Every place that stamps "today" onto a trade, session, or journal
 * entry must go through this, or evening trades in timezones west of
 * UTC silently get dated tomorrow (toISOString() converts to UTC first). */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toLocalDateStr(new Date());
}

/**
 * There's no stored "planned risk" per trade yet, so 1R is approximated as
 * the average losing trade's size (falling back to half the average win if
 * there are no losses yet). This is a proxy, not true position-sized R —
 * flagged in the UI wherever it's shown.
 */
export function computeRiskUnit(trades: Trade[]): number {
  const losses = trades.filter((t) => t.pnl < 0);
  const wins = trades.filter((t) => t.pnl > 0);
  if (losses.length) {
    return Math.abs(
      losses.reduce((s, t) => s + t.pnl, 0) / losses.length
    );
  }
  if (wins.length) {
    return (wins.reduce((s, t) => s + t.pnl, 0) / wins.length) * 0.5;
  }
  return 0;
}

export function fmtR(pnl: number, riskUnit: number): string | null {
  if (!riskUnit) return null;
  const r = pnl / riskUnit;
  return (r >= 0 ? "+" : "") + r.toFixed(1) + "R";
}

export interface DashboardStats {
  total: number;
  tradeCount: number;
  wins: Trade[];
  losses: Trade[];
  winRate: number;
  avgWin: number;
  avgLoss: number;
  cleanPct: number;
  bestDay: number;
  balance: number;
  todayPnl: number;
  profitFactor: number | null; // null = no trades, Infinity = no losses
  avgR: number | null;
  riskUnit: number;
  streak: { count: number; direction: "win" | "loss" | null };
}

export function computeDashboardStats(state: LedgerState): DashboardStats {
  const trades = state.trades;
  const total = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const winRate = trades.length
    ? Math.round((wins.length / trades.length) * 100)
    : 0;
  const avgWin = wins.length
    ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length
    : 0;
  const avgLoss = losses.length
    ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length
    : 0;
  const clean = trades.filter(
    (t) => t.mistakes.length === 0 && t.rulesBroken.length === 0
  );
  const cleanPct = trades.length
    ? Math.round((clean.length / trades.length) * 100)
    : 0;
  const byDay: Record<string, number> = {};
  trades.forEach((t) => (byDay[t.date] = (byDay[t.date] || 0) + t.pnl));
  const bestDay = Object.values(byDay).length
    ? Math.max(...Object.values(byDay))
    : 0;

  const balance = (state.startingBalance || 0) + total;
  const today = todayStr();
  const todayPnl = trades
    .filter((t) => t.date === today)
    .reduce((s, t) => s + t.pnl, 0);

  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLossAbs = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = trades.length === 0
    ? null
    : grossLossAbs === 0
      ? Infinity
      : grossWin / grossLossAbs;

  const riskUnit = computeRiskUnit(trades);
  const avgR =
    trades.length === 0 || riskUnit === 0
      ? null
      : trades.reduce((s, t) => s + t.pnl / riskUnit, 0) / trades.length;

  let streak: DashboardStats["streak"] = { count: 0, direction: null };
  if (trades.length) {
    const byDateDesc = [...trades].sort(
      (a, b) => b.date.localeCompare(a.date) || 0
    );
    let count = 0;
    let dir: "win" | "loss" | null = null;
    for (const t of byDateDesc) {
      const sign: "win" | "loss" | null =
        t.pnl > 0 ? "win" : t.pnl < 0 ? "loss" : null;
      if (sign === null) break;
      if (dir === null) dir = sign;
      if (sign !== dir) break;
      count++;
    }
    streak = { count, direction: count === 0 ? null : dir };
  }

  return {
    total,
    tradeCount: trades.length,
    wins,
    losses,
    winRate,
    avgWin,
    avgLoss,
    cleanPct,
    bestDay,
    balance,
    todayPnl,
    profitFactor,
    avgR,
    riskUnit,
    streak,
  };
}

export interface EquityPoint {
  date: string;
  cumulative: number;
}

export function computeEquityCurve(trades: Trade[]): EquityPoint[] {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let cum = 0;
  return sorted.map((t) => {
    cum += t.pnl;
    return { date: t.date, cumulative: cum };
  });
}

export interface BarEntry {
  label: string;
  value: number;
  count?: number;
}

/** Average P&L grouped by tagged emotion, sorted best to worst. */
export function computeEmotionStats(
  trades: Trade[],
  emotions: readonly string[]
): BarEntry[] {
  const groups: Record<string, number[]> = {};
  emotions.forEach((e) => (groups[e] = []));
  trades.forEach((t) =>
    t.emotions.forEach((e) => {
      if (groups[e]) groups[e].push(t.pnl);
    })
  );
  return Object.entries(groups)
    .filter(([, arr]) => arr.length > 0)
    .map(([label, arr]) => ({
      label,
      value: arr.reduce((s, v) => s + v, 0) / arr.length,
      count: arr.length,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Frequency count of tagged mistakes, sorted most to least common. */
export function computeMistakeStats(
  trades: Trade[],
  mistakes: readonly string[]
): BarEntry[] {
  const counts: Record<string, number> = {};
  mistakes.forEach((m) => (counts[m] = 0));
  trades.forEach((t) =>
    t.mistakes.forEach((m) => (counts[m] = (counts[m] || 0) + 1))
  );
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Frequency count of broken rules, sorted most to least common. */
export function computeRuleViolationStats(
  trades: Trade[],
  rules: LedgerState["rules"]
): BarEntry[] {
  const counts: Record<string, number> = {};
  rules.forEach((r) => (counts[r.id] = 0));
  trades.forEach((t) =>
    t.rulesBroken.forEach((id) => (counts[id] = (counts[id] || 0) + 1))
  );
  return rules
    .map((r) => ({ label: r.text, value: counts[r.id] || 0 }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);
}
