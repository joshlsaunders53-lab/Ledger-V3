import type { SupabaseClient } from "@supabase/supabase-js";
import type { PreTradeCheck, TradingSession } from "@/lib/types";

interface SessionRow {
  id: string;
  date: string;
  sleep: number | null;
  stress: number | null;
  confidence: number | null;
  energy: number | null;
  objective: string | null;
  started_at: string;
  ended_at: string | null;
  objective_met: boolean | null;
  grade: string | null;
  narrative: string[] | null;
}

function rowToSession(row: SessionRow): TradingSession {
  return {
    id: row.id,
    date: row.date,
    preTrade: {
      sleep: row.sleep ?? 5,
      stress: row.stress ?? 5,
      confidence: row.confidence ?? 5,
      energy: row.energy ?? 5,
      objective: row.objective ?? "",
    },
    startedAt: row.started_at,
    endedAt: row.ended_at,
    tradeIds: [], // relational now — see trades.session_id; kept for type compatibility
    objectiveMet: row.objective_met,
    grade: row.grade,
    narrative: row.narrative,
  };
}

export async function fetchSessions(
  supabase: SupabaseClient,
  userId: string
): Promise<TradingSession[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data as SessionRow[]).map(rowToSession);
}

/** The session with ended_at IS NULL, if any — the DB enforces at most
 * one per user via a partial unique index, so this is safe to resume
 * from any device. */
export async function fetchActiveSession(
  supabase: SupabaseClient,
  userId: string
): Promise<TradingSession | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .is("ended_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSession(data as SessionRow) : null;
}

export async function startSession(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  preTrade: PreTradeCheck
): Promise<TradingSession> {
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      date,
      sleep: preTrade.sleep,
      stress: preTrade.stress,
      confidence: preTrade.confidence,
      energy: preTrade.energy,
      objective: preTrade.objective,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToSession(data as SessionRow);
}

export async function finishSession(
  supabase: SupabaseClient,
  sessionId: string,
  patch: { objectiveMet: boolean | null; grade: string; narrative: string[] }
): Promise<TradingSession> {
  const { data, error } = await supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
      objective_met: patch.objectiveMet,
      grade: patch.grade,
      narrative: patch.narrative,
    })
    .eq("id", sessionId)
    .select()
    .single();
  if (error) throw error;
  return rowToSession(data as SessionRow);
}
