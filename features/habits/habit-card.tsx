"use client";

import { Check } from "lucide-react";
import { DisciplineRing } from "@/features/session-history/discipline-ring";
import { computeHabitStreak, computeWeeklyCompletion, computeMonthlyConsistency, computeTrailingDays } from "@/lib/habits-stats";
import { todayStr } from "@/lib/calculations";
import type { Habit, HabitLog } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HabitCard({
  habit,
  logs,
  onToggleToday,
}: {
  habit: Habit;
  logs: HabitLog[];
  onToggleToday: (completed: boolean) => void;
}) {
  const today = todayStr();
  const doneToday = logs.some((l) => l.habitId === habit.id && l.date === today && l.completed);
  const streak = computeHabitStreak(habit.id, logs);
  const weekly = computeWeeklyCompletion(habit.id, logs);
  const monthly = computeMonthlyConsistency(habit.id, logs);
  const trailing = computeTrailingDays(habit.id, logs, 14);

  return (
    <div className="rounded-lg border border-hairline bg-panel-raised p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleToday(!doneToday)}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              doneToday ? "border-teal bg-teal/[.15] text-teal" : "border-hairline text-ledger-faint hover:border-brass-dim"
            )}
          >
            {doneToday && <Check className="h-4 w-4" strokeWidth={3} />}
          </button>
          <div>
            <div className="text-sm font-semibold text-ledger-text">{habit.name}</div>
            <div className="text-xs text-ledger-muted">
              {streak > 0 ? `🔥 ${streak} day${streak === 1 ? "" : "s"}` : "No streak yet"}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <DisciplineRing score={weekly} size={38} strokeWidth={3.5} />
            <span className="mt-1 text-[9px] uppercase tracking-wide text-ledger-faint">Week</span>
          </div>
          <div className="flex flex-col items-center">
            <DisciplineRing score={monthly} size={38} strokeWidth={3.5} />
            <span className="mt-1 text-[9px] uppercase tracking-wide text-ledger-faint">Month</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-1">
        {trailing.map((d) => (
          <div
            key={d.date}
            title={d.date}
            className={cn("h-2 flex-1 rounded-full", d.completed ? "bg-teal" : "bg-hairline")}
          />
        ))}
      </div>
    </div>
  );
}
