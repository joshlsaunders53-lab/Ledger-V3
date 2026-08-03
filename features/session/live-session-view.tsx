"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Square } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeLiveSessionStats } from "@/lib/session";
import type { Trade } from "@/lib/types";
import { staggerContainer, fadeUp } from "@/lib/motion";

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function StatBlock({ value, label, tone }: { value: string; label: string; tone?: "pos" | "neg" | "brass" }) {
  return (
    <div className="text-center">
      <div
        className={
          "font-mono text-3xl font-bold " +
          (tone === "pos" ? "text-teal" : tone === "neg" ? "text-clay" : tone === "brass" ? "text-brass" : "text-ledger-text")
        }
      >
        {value}
      </div>
      <div className="mt-1.5 text-[11px] uppercase tracking-wide text-ledger-muted">{label}</div>
    </div>
  );
}

export function LiveSessionView({
  startedAt,
  trades,
  onAddTrade,
  onEndSession,
}: {
  startedAt: string;
  trades: Trade[];
  onAddTrade: () => void;
  onEndSession: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA"].includes(target.tagName);
      if (typing) return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        onAddTrade();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAddTrade]);

  const elapsed = now - new Date(startedAt).getTime();
  const stats = computeLiveSessionStats(trades);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp} className="text-center">
        <div className="font-mono text-5xl font-bold tracking-tight text-ledger-text">
          {formatElapsed(elapsed)}
        </div>
        <p className="mt-1.5 text-xs uppercase tracking-wide text-ledger-muted">Session in progress</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="grid grid-cols-3 gap-4 py-6">
          <StatBlock value={String(stats.tradeCount)} label="Trades" />
          <StatBlock
            value={String(stats.rulesBrokenCount)}
            label="Rules broken"
            tone={stats.rulesBrokenCount > 0 ? "neg" : "pos"}
          />
          <StatBlock
            value={stats.disciplineScore + "%"}
            label="Discipline"
            tone={stats.disciplineScore >= 80 ? "pos" : stats.disciplineScore >= 50 ? "brass" : "neg"}
          />
        </Card>
      </motion.div>

      {stats.currentEmotion && (
        <motion.div variants={fadeUp} className="text-center text-sm text-ledger-muted">
          Currently feeling <span className="font-semibold text-ledger-text">{stats.currentEmotion}</span>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 pt-4">
        <Button onClick={onAddTrade} size="default" className="w-full max-w-xs py-6 text-base">
          <Plus className="h-5 w-5" />
          Add trade
          <kbd className="ml-2 rounded border border-black/20 bg-black/10 px-1.5 py-0.5 font-mono text-[10px] text-primary-foreground/70">
            N
          </kbd>
        </Button>
        <Button onClick={onEndSession} variant="ghost" className="w-full max-w-xs">
          <Square className="h-3.5 w-3.5" />
          End session
        </Button>
      </motion.div>
    </motion.div>
  );
}
