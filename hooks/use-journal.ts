"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchJournalEntries, saveMorningJournal, saveEveningJournal } from "@/lib/db/journal";
import type { DailyJournalEntry, MorningJournal, EveningJournal } from "@/lib/types";
import { useAuth } from "./use-auth";

const AUTOSAVE_DELAY_MS = 900;

export type SaveStatus = "idle" | "saving" | "saved";

export function useJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [morningStatus, setMorningStatus] = useState<SaveStatus>("idle");
  const [eveningStatus, setEveningStatus] = useState<SaveStatus>("idle");
  const supabaseRef = useRef(createClient());
  const morningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eveningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchJournalEntries(supabaseRef.current, user.id)
      .then((data) => {
        if (!cancelled) setEntries(data);
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

  const saveMorning = useCallback(
    (date: string, morning: MorningJournal) => {
      if (!user) return;
      setEntries((prev) => {
        const existing = prev.find((e) => e.date === date);
        if (existing) return prev.map((e) => (e.date === date ? { ...e, morning } : e));
        return [{ id: crypto.randomUUID(), date, morning, evening: null }, ...prev];
      });

      setMorningStatus("saving");
      if (morningTimer.current) clearTimeout(morningTimer.current);
      morningTimer.current = setTimeout(async () => {
        try {
          await saveMorningJournal(supabaseRef.current, user.id, date, morning);
          setMorningStatus("saved");
          setSyncError(null);
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : String(err));
        }
      }, AUTOSAVE_DELAY_MS);
    },
    [user]
  );

  const saveEvening = useCallback(
    (date: string, evening: EveningJournal) => {
      if (!user) return;
      setEntries((prev) => {
        const existing = prev.find((e) => e.date === date);
        if (existing) return prev.map((e) => (e.date === date ? { ...e, evening } : e));
        return [{ id: crypto.randomUUID(), date, morning: null, evening }, ...prev];
      });

      setEveningStatus("saving");
      if (eveningTimer.current) clearTimeout(eveningTimer.current);
      eveningTimer.current = setTimeout(async () => {
        try {
          await saveEveningJournal(supabaseRef.current, user.id, date, evening);
          setEveningStatus("saved");
          setSyncError(null);
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : String(err));
        }
      }, AUTOSAVE_DELAY_MS);
    },
    [user]
  );

  return { entries, loading, syncError, saveMorning, saveEvening, morningStatus, eveningStatus };
}
