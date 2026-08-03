"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchHabits,
  fetchHabitLogs,
  createHabit,
  renameHabit,
  reorderHabits,
  deleteHabit,
  toggleHabitLog,
} from "@/lib/db/habits";
import type { Habit, HabitLog } from "@/lib/types";
import { useAuth } from "./use-auth";

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([fetchHabits(supabaseRef.current, user.id), fetchHabitLogs(supabaseRef.current, user.id)])
      .then(([h, l]) => {
        if (!cancelled) {
          setHabits(h);
          setLogs(l);
        }
      })
      .catch((err) => {
        if (!cancelled) setSyncError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleToday = useCallback(
    async (habitId: string, date: string, completed: boolean) => {
      if (!user) return;
      setLogs((prev) => {
        const without = prev.filter((l) => !(l.habitId === habitId && l.date === date));
        return completed ? [...without, { habitId, date, completed: true }] : without;
      });
      try {
        await toggleHabitLog(supabaseRef.current, user.id, habitId, date, completed);
        setSyncError(null);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : String(err));
      }
    },
    [user]
  );

  const addHabit = useCallback(
    async (name: string) => {
      if (!user) return;
      const created = await createHabit(supabaseRef.current, user.id, name, habits.length);
      setHabits((prev) => [...prev, created]);
    },
    [user, habits.length]
  );

  const rename = useCallback(async (habitId: string, name: string) => {
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, name } : h)));
    await renameHabit(supabaseRef.current, habitId, name);
  }, []);

  const reorder = useCallback(async (next: Habit[]) => {
    setHabits(next);
    await reorderHabits(
      supabaseRef.current,
      next.map((h, i) => ({ id: h.id, sortOrder: i }))
    );
  }, []);

  const remove = useCallback(async (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    await deleteHabit(supabaseRef.current, habitId);
  }, []);

  return { habits, logs, loading, syncError, toggleToday, addHabit, rename, reorder, remove };
}
