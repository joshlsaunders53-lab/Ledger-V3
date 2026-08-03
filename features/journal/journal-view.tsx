"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useJournal } from "@/hooks/use-journal";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { toLocalDateStr, todayStr } from "@/lib/calculations";
import { MorningSection } from "./morning-section";
import { EveningSection } from "./evening-section";

function JournalSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-[500px] w-full rounded-lg" />
      <Skeleton className="h-[500px] w-full rounded-lg" />
    </div>
  );
}

export function JournalView() {
  const { entries, loading, syncError, saveMorning, saveEvening, morningStatus, eveningStatus } = useJournal();
  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState("");

  const entry = useMemo(() => entries.find((e) => e.date === date) ?? null, [entries, date]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return entries.filter((e) => {
      const haystack = [
        e.morning?.focus, e.morning?.goals, e.morning?.avoid, e.morning?.distraction,
        e.morning?.affirmation, e.morning?.freeWriting,
        e.evening?.proudOf, e.evening?.frustrated, e.evening?.repeatedMistakes,
        e.evening?.learned, e.evening?.improveTomorrow, e.evening?.gratitude, e.evening?.freeWriting,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, search]);

  function shiftDate(days: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    setDate(toLocalDateStr(d));
  }

  if (loading) return <JournalSkeleton />;

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6 pb-10">
      {syncError && (
        <motion.div variants={fadeUp} className="rounded-md border border-clay-dim bg-clay/10 px-4 py-2.5 text-sm text-clay">
          {syncError}
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <h1 className="font-serif text-2xl font-medium">Journal.</h1>
        <p className="mt-1 text-sm text-ledger-muted">Before and after the market — just for you.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="rounded-md border border-hairline p-2 text-ledger-muted transition-colors hover:border-brass-dim hover:text-ledger-text">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[220px] text-center">
            <input
              type="date"
              max={todayStr()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-center font-serif text-lg text-ledger-text outline-none"
            />
          </div>
          <button
            onClick={() => shiftDate(1)}
            disabled={date >= todayStr()}
            className="rounded-md border border-hairline p-2 text-ledger-muted transition-colors hover:border-brass-dim hover:text-ledger-text disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-ledger-muted">{dateLabel}</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ledger-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search previous entries..."
            className="pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ledger-faint hover:text-ledger-text">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {search.trim() && (
          <div className="mt-2 space-y-1">
            {searchResults.length === 0 ? (
              <p className="text-sm italic text-ledger-muted">No entries match &ldquo;{search}&rdquo;.</p>
            ) : (
              searchResults.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setDate(e.date);
                    setSearch("");
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-ledger-muted transition-colors hover:bg-panel-raised hover:text-ledger-text"
                >
                  {new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </button>
              ))
            )}
          </div>
        )}
      </motion.div>

      <motion.div variants={fadeUp}>
        <MorningSection
          value={entry?.morning ?? null}
          onChange={(m) => saveMorning(date, m)}
          status={date === todayStr() || date === entry?.date ? morningStatus : "idle"}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <EveningSection
          value={entry?.evening ?? null}
          onChange={(e) => saveEvening(date, e)}
          status={date === todayStr() || date === entry?.date ? eveningStatus : "idle"}
        />
      </motion.div>
    </motion.div>
  );
}
