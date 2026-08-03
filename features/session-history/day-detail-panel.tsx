"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ExpandableTradeRow } from "./expandable-trade-row";
import { AddTradeModal } from "@/features/session/add-trade-modal";
import { fmtMoney } from "@/lib/calculations";
import type { DayStats } from "@/lib/session-history";
import type { TradingSession, TradeScreenshots } from "@/lib/types";
import type { TradeEditableFields, NewTradeFields } from "@/lib/db/trades";
import { cn } from "@/lib/utils";

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "var(--teal)";
  if (grade.startsWith("B") || grade.startsWith("C")) return "var(--brass)";
  return "var(--clay)";
}

export function DayDetailPanel({
  date,
  stats,
  session,
  riskUnit,
  onOpenChange,
  onEditTrade,
  onDeleteTrade,
  onChangeScreenshot,
  onAddTrade,
}: {
  date: string | null;
  stats: DayStats | null;
  session: TradingSession | null;
  riskUnit: number;
  onOpenChange: (open: boolean) => void;
  onEditTrade: (tradeId: string, patch: TradeEditableFields) => Promise<void>;
  onDeleteTrade: (tradeId: string) => Promise<void>;
  onChangeScreenshot: (tradeId: string, kind: keyof TradeScreenshots, file: File | null) => Promise<void>;
  onAddTrade: (fields: NewTradeFields, screenshots: Partial<Record<keyof TradeScreenshots, File>>) => Promise<void>;
}) {
  const [addOpen, setAddOpen] = useState(false);

  // Always mounted (rather than returning null when nothing's selected) so
  // the drawer is a stable, controlled component from the start.
  const open = date !== null && stats !== null;

  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DrawerTitle>{dateLabel}</DrawerTitle>
              {stats && stats.tradeCount > 0 && (
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span
                    className={cn(
                      "font-mono font-semibold",
                      stats.pnl > 0 ? "text-teal" : stats.pnl < 0 ? "text-clay" : "text-ledger-muted"
                    )}
                  >
                    {fmtMoney(stats.pnl)}
                  </span>
                  <span className="text-ledger-muted">
                    {stats.tradeCount} trade{stats.tradeCount === 1 ? "" : "s"}
                  </span>
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)} className="mr-8 shrink-0">
              <Plus className="h-3.5 w-3.5" /> Add trade
            </Button>
          </div>
        </DrawerHeader>

        <DrawerBody>
          {!stats || stats.tradeCount === 0 ? (
            <p className="py-10 text-center text-sm italic text-ledger-muted">
              No trades logged this day.
            </p>
          ) : (
            <div className="space-y-6">
              {session?.grade && (
                <div className="flex flex-col items-center rounded-lg bg-panel-raised py-6 text-center">
                  <div className="font-serif text-5xl font-medium" style={{ color: gradeColor(session.grade) }}>
                    {session.grade}
                  </div>
                  {session.narrative && session.narrative.length > 0 && (
                    <p className="mt-3 max-w-xs px-4 text-sm text-ledger-muted">
                      {session.narrative[session.narrative.length - 1]}
                    </p>
                  )}
                </div>
              )}

              {session?.preTrade.objective && (
                <p className="text-center text-xs text-ledger-faint">
                  Objective: &ldquo;{session.preTrade.objective}&rdquo;
                </p>
              )}

              <div>
                <div className="mb-2 text-[10.5px] uppercase tracking-wide text-ledger-muted">
                  Trades
                </div>
                <div className="space-y-2">
                  {stats.trades.map((t, i) => (
                    <ExpandableTradeRow
                      key={t.id}
                      trade={t}
                      riskUnit={riskUnit}
                      onEdit={onEditTrade}
                      onDelete={onDeleteTrade}
                      onChangeScreenshot={onChangeScreenshot}
                      defaultOpen={stats.trades.length === 1 || i === 0}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </DrawerBody>
      </DrawerContent>

      {date && (
        <AddTradeModal
          open={addOpen}
          onOpenChange={setAddOpen}
          initialDate={date}
          onSave={onAddTrade}
        />
      )}
    </Drawer>
  );
}
