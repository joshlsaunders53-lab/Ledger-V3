import type { SupabaseClient } from "@supabase/supabase-js";
import type { Rule } from "@/lib/types";

export interface UserSettings {
  startingBalance: number;
  rules: Rule[];
}

export async function fetchSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("settings")
    .select("starting_balance, rules")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { startingBalance: 0, rules: [] };
  return {
    startingBalance: Number(data.starting_balance) || 0,
    rules: (data.rules as Rule[]) ?? [],
  };
}

export async function upsertStartingBalance(
  supabase: SupabaseClient,
  userId: string,
  value: number
): Promise<void> {
  const { error } = await supabase
    .from("settings")
    .upsert(
      { user_id: userId, starting_balance: value, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}

export async function upsertRules(
  supabase: SupabaseClient,
  userId: string,
  rules: Rule[]
): Promise<void> {
  const { error } = await supabase
    .from("settings")
    .upsert(
      { user_id: userId, rules, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}
