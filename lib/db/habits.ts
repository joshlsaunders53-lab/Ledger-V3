import type { SupabaseClient } from "@supabase/supabase-js";
import type { Habit, HabitLog } from "@/lib/types";
import { DEFAULT_HABITS } from "@/lib/types";

interface HabitRow {
  id: string;
  name: string;
  sort_order: number;
}
interface HabitLogRow {
  habit_id: string;
  date: string;
  completed: boolean;
}

function rowToHabit(row: HabitRow): Habit {
  return { id: row.id, name: row.name, sortOrder: row.sort_order };
}

/** Fetches the user's habits, seeding the default set on first-ever visit
 * (zero habits found) so a new account isn't a blank page. */
export async function fetchHabits(supabase: SupabaseClient, userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from("habits")
    .select("id, name, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  if (data.length === 0) {
    const seeded = DEFAULT_HABITS.map((name, i) => ({ user_id: userId, name, sort_order: i }));
    const { data: inserted, error: insertError } = await supabase
      .from("habits")
      .insert(seeded)
      .select("id, name, sort_order");
    if (insertError) throw insertError;
    return (inserted as HabitRow[]).map(rowToHabit).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return (data as HabitRow[]).map(rowToHabit);
}

export async function fetchHabitLogs(supabase: SupabaseClient, userId: string): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("habit_id, date, completed")
    .eq("user_id", userId);
  if (error) throw error;
  return (data as HabitLogRow[]).map((r) => ({ habitId: r.habit_id, date: r.date, completed: r.completed }));
}

export async function createHabit(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  sortOrder: number
): Promise<Habit> {
  const { data, error } = await supabase
    .from("habits")
    .insert({ user_id: userId, name, sort_order: sortOrder })
    .select("id, name, sort_order")
    .single();
  if (error) throw error;
  return rowToHabit(data as HabitRow);
}

export async function renameHabit(supabase: SupabaseClient, habitId: string, name: string): Promise<void> {
  const { error } = await supabase.from("habits").update({ name }).eq("id", habitId);
  if (error) throw error;
}

export async function reorderHabits(
  supabase: SupabaseClient,
  habits: { id: string; sortOrder: number }[]
): Promise<void> {
  await Promise.all(
    habits.map((h) => supabase.from("habits").update({ sort_order: h.sortOrder }).eq("id", h.id))
  );
}

export async function deleteHabit(supabase: SupabaseClient, habitId: string): Promise<void> {
  const { error } = await supabase.from("habits").delete().eq("id", habitId);
  if (error) throw error;
}

/** Toggles a single day's completion for a habit — deletes the log row if
 * un-completing (keeps the table free of noisy "false" rows). */
export async function toggleHabitLog(
  supabase: SupabaseClient,
  userId: string,
  habitId: string,
  date: string,
  completed: boolean
): Promise<void> {
  if (completed) {
    const { error } = await supabase
      .from("habit_logs")
      .upsert({ user_id: userId, habit_id: habitId, date, completed: true }, { onConflict: "habit_id,date" });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("date", date);
    if (error) throw error;
  }
}
