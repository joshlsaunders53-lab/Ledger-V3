"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTrades,
  insertTrade,
  updateTrade,
  deleteTrade,
  setTradeScreenshot,
  type TradeEditableFields,
  type NewTradeFields,
} from "@/lib/db/trades";
import { uploadTradeScreenshot } from "@/lib/db/storage";
import { fetchSessions } from "@/lib/db/sessions";
import { fetchSettings, upsertStartingBalance, upsertRules } from "@/lib/db/settings";
import type { Trade, TradingSession, Rule, TradeScreenshots } from "@/lib/types";
import { useAuth } from "./use-auth";

interface LedgerData {
  trades: Trade[];
  sessions: TradingSession[];
  rules: Rule[];
  startingBalance: number;
}

const EMPTY: LedgerData = { trades: [], sessions: [], rules: [], startingBalance: 0 };

/**
 * Real per-user data, fetched from Postgres and kept in sync live via
 * Supabase Realtime — insert a trade on your phone and it appears on
 * your laptop without a refresh, because both are subscribed to the
 * same postgres_changes channel filtered to this user's rows.
 */
export function useLedgerData() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<LedgerData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setData(EMPTY);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = supabaseRef.current;

    (async () => {
      try {
        const [trades, sessions, settings] = await Promise.all([
          fetchTrades(supabase, user.id),
          fetchSessions(supabase, user.id),
          fetchSettings(supabase, user.id),
        ]);
        if (!cancelled) {
          setData({ trades, sessions, rules: settings.rules, startingBalance: settings.startingBalance });
          setSyncError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setSyncError(`Couldn't load your data: ${message}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`ledger-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trades", filter: `user_id=eq.${user.id}` },
        () => fetchTrades(supabase, user.id).then((trades) => setData((d) => ({ ...d, trades })))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `user_id=eq.${user.id}` },
        () => fetchSessions(supabase, user.id).then((sessions) => setData((d) => ({ ...d, sessions })))
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, authLoading]);

  const addTrade = useCallback(
    async (fields: NewTradeFields, sessionId: string | null, screenshots: Partial<Record<keyof TradeScreenshots, File>>) => {
      if (!user) return;
      const saved = await insertTrade(supabaseRef.current, user.id, sessionId, fields);
      setData((d) => ({ ...d, trades: [saved, ...d.trades] }));

      const kinds = Object.keys(screenshots) as (keyof TradeScreenshots)[];
      for (const kind of kinds) {
        const file = screenshots[kind];
        if (!file) continue;
        try {
          const path = await uploadTradeScreenshot(supabaseRef.current, user.id, saved.id, kind, file);
          const updated = await setTradeScreenshot(supabaseRef.current, saved.id, kind, path);
          setData((d) => ({ ...d, trades: d.trades.map((t) => (t.id === saved.id ? updated : t)) }));
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          setSyncError(`Trade saved, but the ${kind} screenshot failed to upload: ${message}`);
        }
      }
    },
    [user]
  );

  const editTrade = useCallback(
    async (tradeId: string, patch: TradeEditableFields) => {
      try {
        const updated = await updateTrade(supabaseRef.current, tradeId, patch);
        setData((d) => ({ ...d, trades: d.trades.map((t) => (t.id === tradeId ? updated : t)) }));
        setSyncError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setSyncError(`Couldn't save changes: ${message}`);
        throw err;
      }
    },
    []
  );

  const changeTradeScreenshot = useCallback(
    async (tradeId: string, kind: keyof TradeScreenshots, file: File | null) => {
      if (!user) return;
      try {
        const path = file ? await uploadTradeScreenshot(supabaseRef.current, user.id, tradeId, kind, file) : null;
        const updated = await setTradeScreenshot(supabaseRef.current, tradeId, kind, path);
        setData((d) => ({ ...d, trades: d.trades.map((t) => (t.id === tradeId ? updated : t)) }));
        setSyncError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setSyncError(`Couldn't update screenshot: ${message}`);
        throw err;
      }
    },
    [user]
  );

  const removeTrade = useCallback(async (tradeId: string) => {
    try {
      await deleteTrade(supabaseRef.current, tradeId);
      setData((d) => ({ ...d, trades: d.trades.filter((t) => t.id !== tradeId) }));
      setSyncError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSyncError(`Couldn't delete trade: ${message}`);
      throw err;
    }
  }, []);

  const updateStartingBalance = useCallback(
    async (value: number) => {
      if (!user) return;
      setData((d) => ({ ...d, startingBalance: value }));
      await upsertStartingBalance(supabaseRef.current, user.id, value);
    },
    [user]
  );

  const updateRules = useCallback(
    async (rules: Rule[]) => {
      if (!user) return;
      setData((d) => ({ ...d, rules }));
      await upsertRules(supabaseRef.current, user.id, rules);
    },
    [user]
  );

  return {
    state: data,
    loading: loading || authLoading,
    syncError,
    addTrade,
    editTrade,
    changeTradeScreenshot,
    removeTrade,
    updateStartingBalance,
    updateRules,
  };
}
