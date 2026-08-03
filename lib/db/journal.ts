import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyJournalEntry, MorningJournal, EveningJournal } from "@/lib/types";

interface JournalRow {
  id: string;
  date: string;
  morning: MorningJournal | null;
  // Note: this column is named `reflection` in the database (it predates
  // Priority 4 by months) but stores the full Evening Journal object —
  // renaming it isn't worth a migration for a name mismatch only visible
  // in this file.
  reflection: EveningJournal | null;
}

function rowToEntry(row: JournalRow): DailyJournalEntry {
  return {
    id: row.id,
    date: row.date,
    morning: row.morning,
    evening: row.reflection,
  };
}

export async function fetchJournalEntries(
  supabase: SupabaseClient,
  userId: string
): Promise<DailyJournalEntry[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, date, morning, reflection")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data as JournalRow[]).map(rowToEntry);
}

export async function saveMorningJournal(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  morning: MorningJournal
): Promise<DailyJournalEntry> {
  const { data, error } = await supabase
    .from("journal_entries")
    .upsert({ user_id: userId, date, morning }, { onConflict: "user_id,date" })
    .select("id, date, morning, reflection")
    .single();
  if (error) throw error;
  return rowToEntry(data as JournalRow);
}

export async function saveEveningJournal(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  evening: EveningJournal
): Promise<DailyJournalEntry> {
  const { data, error } = await supabase
    .from("journal_entries")
    .upsert({ user_id: userId, date, reflection: evening }, { onConflict: "user_id,date" })
    .select("id, date, morning, reflection")
    .single();
  if (error) throw error;
  return rowToEntry(data as JournalRow);
}
