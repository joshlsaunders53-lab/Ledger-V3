"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DisciplineRing } from "./discipline-ring";
import { fmtShort, toLocalDateStr } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import type { computeMonthCalendar } from "@/lib/session-history";

type CalendarCells = ReturnType<typeof computeMonthCalendar>;

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pnlIntensity(pnl: number, maxAbs: number) {
  if (maxAbs === 0) return 0;
  return Math.min(1, Math.abs(pnl) / maxAbs);
}

const ROW_TEMPLATE = "grid-cols-[repeat(7,1fr)_64px]";

export function CalendarView({
  year,
  month,
  cells,
  selectedDate,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: {
  year: number;
  month: number;
  cells: CalendarCells;
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const [direction, setDirection] = useState(0);
  const todayStr = toLocalDateStr(new Date());

  const maxAbsPnl = Math.max(
    1,
    ...cells.filter((c) => c.stats.tradeCount > 0).map((c) => Math.abs(c.stats.pnl))
  );

  const weeks: CalendarCells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl font-medium">
          {MONTH_LABELS[month]} {year}
        </h2>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDirection(-1);
              onPrevMonth();
            }}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDirection(1);
              onNextMonth();
            }}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={cn("mb-2 grid gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ledger-muted", ROW_TEMPLATE)}>
        {WEEKDAY_HEADERS.map((d) => (
          <div key={d}>{d}</div>
        ))}
        <div className="text-ledger-faint">Wk</div>
      </div>

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`${year}-${month}`}
            custom={direction}
            initial={{ x: direction * 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 24, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            className="space-y-1.5"
          >
            {weeks.map((week, wi) => {
              const weekPnl = week.reduce((s, c) => s + c.stats.pnl, 0);
              const weekHasTrades = week.some((c) => c.stats.tradeCount > 0);
              return (
                <div key={wi} className={cn("grid gap-1.5", ROW_TEMPLATE)}>
                  {week.map((cell) => {
                    const { date, inMonth, stats } = cell;
                    const isToday = date === todayStr;
                    const isSelected = date === selectedDate;
                    const hasTrades = stats.tradeCount > 0;
                    const intensity = hasTrades ? pnlIntensity(stats.pnl, maxAbsPnl) : 0;
                    const bg = !hasTrades
                      ? "transparent"
                      : stats.pnl >= 0
                        ? `rgba(91,156,147,${0.12 + intensity * 0.5})`
                        : `rgba(193,87,63,${0.12 + intensity * 0.5})`;

                    return (
                      <button
                        key={date}
                        onClick={() => onSelectDay(date)}
                        style={{ background: bg }}
                        className={cn(
                          "relative flex aspect-square flex-col justify-between rounded-md border p-1.5 text-left transition-transform hover:-translate-y-0.5",
                          inMonth ? "border-hairline-soft" : "border-transparent opacity-30",
                          isSelected && "!border-brass ring-1 ring-brass",
                          isToday && !isSelected && "border-ledger-muted"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={cn(
                              "text-[11px] font-medium",
                              inMonth ? "text-ledger-muted" : "text-ledger-faint"
                            )}
                          >
                            {parseInt(date.slice(8, 10), 10)}
                          </span>
                          {hasTrades && <DisciplineRing score={stats.disciplineScore} size={13} strokeWidth={2} />}
                        </div>
                        {hasTrades && (
                          <div className="hidden items-baseline justify-between gap-1 sm:flex">
                            <span
                              className={cn(
                                "font-mono text-[10px] font-bold leading-none",
                                stats.pnl >= 0 ? "text-teal" : "text-clay"
                              )}
                            >
                              {stats.pnl >= 0 ? "+" : ""}
                              {fmtShort(stats.pnl)}
                            </span>
                            <span className="font-mono text-[9px] leading-none text-ledger-faint">
                              {stats.tradeCount}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                  <div className="flex flex-col items-center justify-center rounded-md border border-hairline-soft bg-panel-raised/50 px-1 text-center">
                    <span
                      className={cn(
                        "font-mono text-[10px] font-bold leading-tight",
                        !weekHasTrades ? "text-ledger-faint" : weekPnl >= 0 ? "text-teal" : "text-clay"
                      )}
                    >
                      {weekHasTrades ? fmtShort(weekPnl) : "–"}
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-ledger-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(91,156,147,.5)" }} />
          Profitable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(193,87,63,.5)" }} />
          Losing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-hairline-soft" />
          No trades
        </span>
        <span className="flex items-center gap-1.5">
          <DisciplineRing score={90} size={13} strokeWidth={2} />
          Discipline score
        </span>
        <span className="text-ledger-faint">Wk = that week&apos;s total P&amp;L</span>
      </div>
    </div>
  );
}
