import type { SupabaseClient } from "@supabase/supabase-js";
import type { Trade, TradingSession } from "@/lib/types";
import { computeWeeklyReview, type WeeklyReview } from "@/lib/weekly-review";

interface WeeklyReviewRow {
  avg_score: number | null;
  sessions_count: number;
  total_trades: number;
  pnl: number;
  objectives_met: number;
  narrative: string[] | null;
}

function rowToReview(row: WeeklyReviewRow): WeeklyReview {
  return {
    avgScore: row.avg_score,
    sessionsCount: row.sessions_count,
    totalTrades: row.total_trades,
    pnl: Number(row.pnl),
    objectivesMet: row.objectives_met,
    gradeLetters: [], // not persisted individually; narrative covers the summary
    narrative: row.narrative ?? [],
  };
}

/**
 * Returns this week's review, computing and caching it on first request.
 * Recomputing on every load would be wasteful once this calls a real LLM
 * instead of the current formula — this table exists so that swap doesn't
 * need a schema change.
 */
export async function getOrCreateWeeklyReview(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string, // YYYY-MM-DD, Sunday of the target week
  sessions: TradingSession[],
  trades: Trade[],
  weekDates: string[]
): Promise<WeeklyReview> {
  const { data: existing, error: fetchError } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return rowToReview(existing as WeeklyReviewRow);

  const computed = computeWeeklyReview(sessions, trades, weekDates);

  const { error: insertError } = await supabase.from("weekly_reviews").insert({
    user_id: userId,
    week_start: weekStart,
    avg_score: computed.avgScore,
    sessions_count: computed.sessionsCount,
    total_trades: computed.totalTrades,
    pnl: computed.pnl,
    objectives_met: computed.objectivesMet,
    narrative: computed.narrative,
  });
  // A duplicate-key race (two devices generating the same week at once) is
  // fine to ignore — whichever won, the computed value here is equivalent.
  if (insertError && insertError.code !== "23505") throw insertError;

  return computed;
}
