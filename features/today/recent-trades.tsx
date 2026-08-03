"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSignedScreenshotUrl } from "@/lib/db/storage";
import { fmtMoney, fmtR } from "@/lib/calculations";
import type { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

function TradeCard({ trade, riskUnit, onClick }: { trade: Trade; riskUnit: number; onClick: () => void }) {
  const [thumb, setThumb] = useState<string | null>(null);
  const isWin = trade.pnl >= 0;
  const rText = fmtR(trade.pnl, riskUnit);
  const thumbPath = trade.screenshots?.before || trade.screenshots?.markup || trade.screenshots?.after;

  useEffect(() => {
    if (!thumbPath) return;
    let cancelled = false;
    getSignedScreenshotUrl(createClient(), thumbPath).then((url) => {
      if (!cancelled) setThumb(url);
    });
    return () => {
      cancelled = true;
    };
  }, [thumbPath]);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg border border-hairline bg-panel-raised p-4 text-left transition-colors hover:border-brass-dim hover:bg-panel-hover"
    >
      {thumbPath ? (
        thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
        ) : (
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-md bg-panel" />
        )
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-panel text-ledger-faint">
          <ImageIcon className="h-5 w-5" />
        </div>
      )}

      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          trade.direction === "long" ? "bg-teal/[.15] text-teal" : "bg-clay/[.15] text-clay"
        )}
      >
        {trade.direction === "long" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold">{trade.symbol}</span>
          {trade.setup && <span className="truncate text-xs text-ledger-faint">{trade.setup}</span>}
        </div>
        <div className="mt-0.5 text-xs text-ledger-muted">{trade.date}</div>
      </div>

      <div className="text-right">
        <div className={cn("font-mono text-base font-bold", isWin ? "text-teal" : "text-clay")}>
          {fmtMoney(trade.pnl)}
        </div>
        {rText && <div className="text-xs text-ledger-faint">{rText}</div>}
      </div>
    </button>
  );
}

export function RecentTradesList({
  trades,
  riskUnit,
  onSelectTrade,
}: {
  trades: Trade[];
  riskUnit: number;
  onSelectTrade: (trade: Trade) => void;
}) {
  if (trades.length === 0) {
    return (
      <div className="py-10 text-center text-sm italic text-ledger-muted">
        Log a trade to see it here.
      </div>
    );
  }

  const recent = [...trades]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-2.5">
      {recent.map((t) => (
        <TradeCard key={t.id} trade={t} riskUnit={riskUnit} onClick={() => onSelectTrade(t)} />
      ))}
    </div>
  );
}
