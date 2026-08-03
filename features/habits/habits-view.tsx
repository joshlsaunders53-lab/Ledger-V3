"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import { useHabits } from "@/hooks/use-habits";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { todayStr } from "@/lib/calculations";
import { HabitCard } from "./habit-card";
import { HabitManager } from "./habit-manager";

function HabitsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-[90px] w-full rounded-lg" />
      <Skeleton className="h-[90px] w-full rounded-lg" />
      <Skeleton className="h-[90px] w-full rounded-lg" />
    </div>
  );
}

export function HabitsView() {
  const { habits, logs, loading, syncError, toggleToday, addHabit, rename, reorder, remove } = useHabits();
  const [managing, setManaging] = useState(false);

  if (loading) return <HabitsSkeleton />;

  const today = todayStr();
  const doneCount = habits.filter((h) => logs.some((l) => l.habitId === h.id && l.date === today && l.completed)).length;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6 pb-10">
      {syncError && (
        <motion.div variants={fadeUp} className="rounded-md border border-clay-dim bg-clay/10 px-4 py-2.5 text-sm text-clay">
          {syncError}
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-medium">Habits.</h1>
          <p className="mt-1 text-sm text-ledger-muted">
            {habits.length > 0 ? `${doneCount} of ${habits.length} done today` : "Nothing tracked yet."}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setManaging((m) => !m)}>
          <Settings2 className="h-3.5 w-3.5" /> {managing ? "Done" : "Manage"}
        </Button>
      </motion.div>

      {managing ? (
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle>Manage habits</CardTitle>
            </CardHeader>
            <CardContent>
              <HabitManager habits={habits} onAdd={addHabit} onRename={rename} onReorder={reorder} onRemove={remove} />
            </CardContent>
          </Card>
        </motion.div>
      ) : habits.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card className="py-12 text-center">
            <p className="text-sm italic text-ledger-muted">No habits yet — tap Manage to add some.</p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {habits.map((h) => (
            <motion.div key={h.id} variants={fadeUp}>
              <HabitCard habit={h} logs={logs} onToggleToday={(completed) => toggleToday(h.id, today, completed)} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
