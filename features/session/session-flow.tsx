"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLedgerData } from "@/hooks/use-ledger-data";
import { useActiveSession } from "@/hooks/use-active-session";
import { Skeleton } from "@/components/ui/skeleton";
import { computeCoachVerdict } from "@/lib/coach";
import type { PreTradeCheck, TradeScreenshots } from "@/lib/types";
import type { NewTradeFields } from "@/lib/db/trades";
import { PreTradeForm } from "./pre-trade-form";
import { LiveSessionView } from "./live-session-view";
import { AddTradeModal } from "./add-trade-modal";
import { EndSessionReview } from "./end-session-review";

function FlowSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-[260px] w-full rounded-lg" />
      <Skeleton className="h-[200px] w-full rounded-lg" />
    </div>
  );
}

export function SessionFlow() {
  const { state, loading, syncError, addTrade } = useLedgerData();
  const { session, phase, startSession, endSession, finishSession } = useActiveSession();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading || phase === "loading") return <FlowSkeleton />;

  const sessionTrades = session ? state.trades.filter((t) => t.sessionId === session.id) : [];

  async function handleSaveTrade(fields: NewTradeFields, screenshots: Partial<Record<keyof TradeScreenshots, File>>) {
    await addTrade(fields, session?.id ?? null, screenshots);
  }

  async function handleFinish(objectiveMet: boolean | null) {
    const verdict = computeCoachVerdict(sessionTrades, objectiveMet, session?.preTrade.objective);
    await finishSession(objectiveMet, verdict.grade, verdict.narrative);
  }

  return (
    <div>
      {syncError && (
        <div className="mb-4 rounded-md border border-clay-dim bg-clay/10 px-4 py-2.5 text-sm text-clay">
          {syncError}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "pretrade" && (
          <motion.div
            key="pretrade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <PreTradeForm onComplete={(values) => startSession(values as PreTradeCheck)} />
          </motion.div>
        )}

        {phase === "live" && session && (
          <motion.div
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <LiveSessionView
              startedAt={session.startedAt}
              trades={sessionTrades}
              onAddTrade={() => setModalOpen(true)}
              onEndSession={endSession}
            />
          </motion.div>
        )}

        {phase === "review" && session && (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <EndSessionReview
              trades={sessionTrades}
              objective={session.preTrade.objective}
              onFinish={handleFinish}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AddTradeModal open={modalOpen} onOpenChange={setModalOpen} onSave={handleSaveTrade} />
    </div>
  );
}
