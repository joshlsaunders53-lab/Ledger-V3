"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchActiveSession, startSession as startSessionDb, finishSession as finishSessionDb } from "@/lib/db/sessions";
import type { PreTradeCheck, TradingSession } from "@/lib/types";
import { todayStr } from "@/lib/calculations";
import { useAuth } from "./use-auth";

export type SessionPhase = "loading" | "pretrade" | "live" | "review";

/**
 * Replaces the old localStorage-backed version entirely. The single
 * source of truth for "is there a session in progress" is now the
 * `sessions` row with ended_at IS NULL — enforced unique per user at the
 * database level, so this is safe to resume from any device: sign in on
 * your phone mid-session and you land on the live screen, not a fresh
 * pre-trade form.
 */
export function useActiveSession() {
  const { user } = useAuth();
  const [session, setSession] = useState<TradingSession | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const active = await fetchActiveSession(supabaseRef.current, user.id);
        if (!cancelled) setSession(active);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const phase: SessionPhase = !user || loading ? "loading" : !session ? "pretrade" : reviewing ? "review" : "live";

  const startSession = useCallback(
    async (preTrade: PreTradeCheck) => {
      if (!user) return;
      const created = await startSessionDb(supabaseRef.current, user.id, todayStr(), preTrade);
      setSession(created);
    },
    [user]
  );

  /** Purely a local UI transition — moves from the live screen to the
   * "did you meet your objective?" question. No DB write happens until
   * finishSession, so an interrupted end-of-session just resumes as
   * "live" again rather than getting stuck half-finished. */
  const endSession = useCallback(() => {
    setReviewing(true);
  }, []);

  const finishSession = useCallback(
    async (objectiveMet: boolean | null, grade: string, narrative: string[]) => {
      if (!session) return;
      await finishSessionDb(supabaseRef.current, session.id, { objectiveMet, grade, narrative });
      setSession(null);
      setReviewing(false);
    },
    [session]
  );

  return { session, phase, startSession, endSession, finishSession };
}
