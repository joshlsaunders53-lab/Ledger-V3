import type { SupabaseClient } from "@supabase/supabase-js";
import type { Trade, TradeScreenshots } from "@/lib/types";

interface TradeRow {
  id: string;
  session_id: string | null;
  date: string;
  symbol: string;
  direction: "long" | "short";
  entry: number | null;
  exit: number | null;
  stop: number | null;
  target: number | null;
  size: number | null;
  pnl: number;
  account: string | null;
  setup: string | null;
  duration_minutes: number | null;
  execution_score: number | null;
  emotion_before: string | null;
  emotion_after: string | null;
  mistake: string | null;
  tags: string[];
  emotions: string[];
  mistakes: string[];
  rules_broken: string[];
  notes: string | null;
  reflection: string | null;
  confidence: number | null;
  followed_plan: boolean | null;
  screenshot_url: string | null;
  screenshots: TradeScreenshots | null;
  created_at: string;
}

function rowToTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    sessionId: row.session_id ?? undefined,
    date: row.date,
    symbol: row.symbol,
    direction: row.direction,
    entry: row.entry ?? undefined,
    exit: row.exit ?? undefined,
    stop: row.stop ?? undefined,
    target: row.target ?? undefined,
    size: row.size ?? undefined,
    pnl: row.pnl,
    account: row.account ?? undefined,
    setup: row.setup ?? "",
    durationMinutes: row.duration_minutes ?? undefined,
    executionScore: row.execution_score ?? undefined,
    emotionBefore: row.emotion_before ?? undefined,
    emotionAfter: row.emotion_after ?? undefined,
    mistake: row.mistake ?? undefined,
    tags: row.tags ?? [],
    emotions: row.emotions ?? [],
    mistakes: row.mistakes ?? [],
    rulesBroken: row.rules_broken ?? [],
    notes: row.notes ?? "",
    reflection: row.reflection ?? undefined,
    confidence: row.confidence ?? undefined,
    followedPlan: row.followed_plan ?? undefined,
    // Legacy single-screenshot trades still show up under "before".
    screenshots: {
      before: row.screenshots?.before ?? row.screenshot_url ?? null,
      during: row.screenshots?.during ?? null,
      after: row.screenshots?.after ?? null,
      markup: row.screenshots?.markup ?? null,
    },
    createdAt: row.created_at,
  };
}

export async function fetchTrades(supabase: SupabaseClient, userId: string): Promise<Trade[]> {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TradeRow[]).map(rowToTrade);
}

export async function fetchTradeById(
  supabase: SupabaseClient,
  userId: string,
  tradeId: string
): Promise<Trade | null> {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .eq("id", tradeId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToTrade(data as TradeRow) : null;
}

export interface NewTradeFields {
  id: string;
  date: string;
  symbol: string;
  direction: "long" | "short";
  entry?: number;
  exit?: number;
  stop?: number;
  target?: number;
  size?: number;
  pnl: number;
  account?: string;
  setup: string;
  durationMinutes?: number;
  executionScore?: number;
  emotionBefore?: string;
  emotionAfter?: string;
  mistake?: string;
  tags: string[];
  notes: string;
  reflection: string;
  confidence?: number;
  followedPlan: boolean;
  mistakes: string[];
}

type SharedTradeFields = Omit<NewTradeFields, "id" | "date" | "symbol" | "direction" | "pnl" | "confidence" | "mistakes">;

function toRowPayload(trade: SharedTradeFields) {
  return {
    entry: trade.entry ?? null,
    exit: trade.exit ?? null,
    stop: trade.stop ?? null,
    target: trade.target ?? null,
    size: trade.size ?? null,
    account: trade.account || null,
    setup: trade.setup || null,
    duration_minutes: trade.durationMinutes ?? null,
    execution_score: trade.executionScore ?? null,
    emotion_before: trade.emotionBefore || null,
    emotion_after: trade.emotionAfter || null,
    mistake: trade.mistake || null,
    tags: trade.tags ?? [],
    notes: trade.notes || null,
    reflection: trade.reflection || null,
    followed_plan: trade.followedPlan,
  };
}

export async function insertTrade(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string | null,
  trade: NewTradeFields
): Promise<Trade> {
  const { data, error } = await supabase
    .from("trades")
    .insert({
      id: trade.id,
      user_id: userId,
      session_id: sessionId,
      date: trade.date,
      symbol: trade.symbol,
      direction: trade.direction,
      pnl: trade.pnl,
      confidence: trade.confidence ?? null,
      emotions: [],
      mistakes: trade.mistakes,
      rules_broken: [],
      ...toRowPayload(trade),
    })
    .select()
    .single();
  if (error) throw error;
  return rowToTrade(data as TradeRow);
}

export interface TradeEditableFields {
  symbol: string;
  direction: "long" | "short";
  entry?: number;
  exit?: number;
  stop?: number;
  target?: number;
  size?: number;
  pnl: number;
  account?: string;
  setup: string;
  durationMinutes?: number;
  executionScore?: number;
  emotionBefore?: string;
  emotionAfter?: string;
  mistake?: string;
  tags: string[];
  notes: string;
  reflection: string;
  followedPlan: boolean;
}

export async function updateTrade(
  supabase: SupabaseClient,
  tradeId: string,
  patch: TradeEditableFields
): Promise<Trade> {
  const { data, error } = await supabase
    .from("trades")
    .update({
      symbol: patch.symbol.toUpperCase(),
      direction: patch.direction,
      pnl: patch.pnl,
      mistakes: patch.followedPlan ? [] : ["Broke trading plan"],
      ...toRowPayload(patch),
    })
    .eq("id", tradeId)
    .select()
    .single();
  if (error) throw error;
  return rowToTrade(data as TradeRow);
}

/** Merges one screenshot slot into the trade's screenshots jsonb without
 * disturbing the other slots. */
export async function setTradeScreenshot(
  supabase: SupabaseClient,
  tradeId: string,
  kind: keyof TradeScreenshots,
  path: string | null
): Promise<Trade> {
  const { data: existing, error: fetchError } = await supabase
    .from("trades")
    .select("screenshots")
    .eq("id", tradeId)
    .single();
  if (fetchError) throw fetchError;

  const merged: TradeScreenshots = { ...(existing?.screenshots ?? {}), [kind]: path };

  const { data, error } = await supabase
    .from("trades")
    .update({ screenshots: merged })
    .eq("id", tradeId)
    .select()
    .single();
  if (error) throw error;
  return rowToTrade(data as TradeRow);
}

export async function deleteTrade(supabase: SupabaseClient, tradeId: string): Promise<void> {
  const { error } = await supabase.from("trades").delete().eq("id", tradeId);
  if (error) throw error;
}
