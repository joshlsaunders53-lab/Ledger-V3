"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLedgerData } from "@/hooks/use-ledger-data";
import { Skeleton } from "@/components/ui/skeleton";
import { computeMonthCalendar, computeDayStats } from "@/lib/session-history";
import { computeRiskUnit, fmtMoney } from "@/lib/calculations";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { CalendarView } from "./calendar-view";
import { DayDetailPanel } from "./day-detail-panel";

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[380px] w-full rounded-lg" />
    </div>
  );
}

export function SessionHistoryView() {
  const { state, loading, syncError, addTrade, editTrade, removeTrade, changeTradeScreenshot } = useLedgerData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const cells = useMemo(
    () => computeMonthCalendar(year, month, state.trades, state.sessions),
    [year, month, state.trades, state.sessions]
  );

  const riskUnit = useMemo(() => computeRiskUnit(state.trades), [state.trades]);

  const monthlyPnl = useMemo(
    () => cells.filter((c) => c.inMonth).reduce((s, c) => s + c.stats.pnl, 0),
    [cells]
  );

  const monthStats = useMemo(() => {
    const inMonthCells = cells.filter((c) => c.inMonth);
    const monthTrades = inMonthCells.flatMap((c) => c.stats.trades);
    const tradingDays = inMonthCells.filter((c) => c.stats.tradeCount > 0).length;
    const winRate = monthTrades.length
      ? Math.round((monthTrades.filter((t) => t.pnl > 0).length / monthTrades.length) * 100)
      : null;
    const avgDailyPnl = tradingDays > 0 ? monthlyPnl / tradingDays : null;
    return { winRate, tradingDays, avgDailyPnl };
  }, [cells, monthlyPnl]);

  const selectedDayStats = useMemo(() => {
    if (!selectedDate) return null;
    return computeDayStats(selectedDate, state.trades, state.sessions, riskUnit);
  }, [selectedDate, state.trades, state.sessions, riskUnit]);

  const selectedSession = useMemo(() => {
    if (!selectedDate) return null;
    return state.sessions.find((s) => s.date === selectedDate) ?? null;
  }, [selectedDate, state.sessions]);

  if (loading) return <HistorySkeleton />;

  function goToMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      {syncError && (
        <motion.div
          variants={fadeUp}
          className="rounded-md border border-clay-dim bg-clay/10 px-4 py-2.5 text-sm text-clay"
        >
          {syncError}
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <h1 className="font-serif text-2xl font-medium">What happened.</h1>
        <p className="mt-1 text-sm text-ledger-muted">Tap any day to see that session's grade.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-lg border border-hairline bg-panel-raised p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-ledger-muted">Monthly P&amp;L</div>
          <div className={`mt-1.5 font-mono text-lg font-bold ${monthlyPnl >= 0 ? "text-teal" : "text-clay"}`}>
            {fmtMoney(monthlyPnl)}
          </div>
        </div>
        <div className="rounded-lg border border-hairline bg-panel-raised p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-ledger-muted">Win rate</div>
          <div className="mt-1.5 font-mono text-lg font-bold text-brass">
            {monthStats.winRate !== null ? monthStats.winRate + "%" : "–"}
          </div>
        </div>
        <div className="rounded-lg border border-hairline bg-panel-raised p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-ledger-muted">Trading days</div>
          <div className="mt-1.5 font-mono text-lg font-bold text-ledger-text">{monthStats.tradingDays}</div>
        </div>
        <div className="rounded-lg border border-hairline bg-panel-raised p-3.5">
          <div className="text-[10px] uppercase tracking-wide text-ledger-muted">Avg daily P&amp;L</div>
          <div
            className={`mt-1.5 font-mono text-lg font-bold ${
              monthStats.avgDailyPnl === null ? "text-ledger-faint" : monthStats.avgDailyPnl >= 0 ? "text-teal" : "text-clay"
            }`}
          >
            {monthStats.avgDailyPnl !== null ? fmtMoney(monthStats.avgDailyPnl) : "–"}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <CalendarView
          year={year}
          month={month}
          cells={cells}
          selectedDate={selectedDate}
          onSelectDay={setSelectedDate}
          onPrevMonth={() => goToMonth(-1)}
          onNextMonth={() => goToMonth(1)}
        />
      </motion.div>

      <DayDetailPanel
        date={selectedDate}
        stats={selectedDayStats}
        session={selectedSession}
        riskUnit={riskUnit}
        onOpenChange={(open) => !open && setSelectedDate(null)}
        onEditTrade={editTrade}
        onDeleteTrade={removeTrade}
        onChangeScreenshot={changeTradeScreenshot}
        onAddTrade={(fields, screenshots) => addTrade(fields, null, screenshots)}
      />
    </motion.div>
  );
}
