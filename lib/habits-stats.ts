import type { HabitLog } from "./types";
import { toLocalDateStr } from "./calculations";

function completedDatesFor(habitId: string, logs: HabitLog[]): Set<string> {
  return new Set(logs.filter((l) => l.habitId === habitId && l.completed).map((l) => l.date));
}

/** Current consecutive-day streak, counting backward from today. A gap
 * (including today not yet done) ends the streak at the most recent
 * unbroken run ending yesterday or today. */
export function computeHabitStreak(habitId: string, logs: HabitLog[], today = toLocalDateStr(new Date())): number {
  const done = completedDatesFor(habitId, logs);
  let streak = 0;
  const cursor = new Date(today + "T00:00:00");

  // If today isn't done yet, start counting from yesterday instead —
  // otherwise a habit not yet checked off today would show 0 all day.
  if (!done.has(toLocalDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (done.has(toLocalDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** % of the last 7 days (including today) completed. */
export function computeWeeklyCompletion(habitId: string, logs: HabitLog[], today = toLocalDateStr(new Date())): number {
  const done = completedDatesFor(habitId, logs);
  const cursor = new Date(today + "T00:00:00");
  let count = 0;
  for (let i = 0; i < 7; i++) {
    if (done.has(toLocalDateStr(cursor))) count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return Math.round((count / 7) * 100);
}

/** % of days completed so far in the current calendar month (up to and
 * including today, not the whole month if it isn't over yet). */
export function computeMonthlyConsistency(habitId: string, logs: HabitLog[], today = toLocalDateStr(new Date())): number {
  const done = completedDatesFor(habitId, logs);
  const todayDate = new Date(today + "T00:00:00");
  const dayOfMonth = todayDate.getDate();
  let count = 0;
  for (let d = 1; d <= dayOfMonth; d++) {
    const cursor = new Date(todayDate.getFullYear(), todayDate.getMonth(), d);
    if (done.has(toLocalDateStr(cursor))) count++;
  }
  return Math.round((count / dayOfMonth) * 100);
}

/** Last N days as {date, completed} — used for a small trailing dot strip. */
export function computeTrailingDays(habitId: string, logs: HabitLog[], days = 14, today = toLocalDateStr(new Date())) {
  const done = completedDatesFor(habitId, logs);
  const cursor = new Date(today + "T00:00:00");
  const result: { date: string; completed: boolean }[] = [];
  for (let i = 0; i < days; i++) {
    const date = toLocalDateStr(cursor);
    result.unshift({ date, completed: done.has(date) });
    cursor.setDate(cursor.getDate() - 1);
  }
  return result;
}
