import type { Trade } from "./types";

/** Live-screen stats: trades count, rules broken, discipline score, current emotion. */
export function computeLiveSessionStats(trades: Trade[]) {
  const rulesBrokenCount = trades.filter((t) => t.followedPlan === false).length;
  const disciplineScore = trades.length
    ? Math.round(((trades.length - rulesBrokenCount) / trades.length) * 100)
    : 100;
  const currentEmotion =
    trades.length > 0 ? trades[trades.length - 1].emotions[0] ?? null : null;

  return {
    tradeCount: trades.length,
    rulesBrokenCount,
    disciplineScore,
    currentEmotion,
  };
}
