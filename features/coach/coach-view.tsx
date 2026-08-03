"use client";

import { motion } from "framer-motion";
import { useLedgerData } from "@/hooks/use-ledger-data";
import { Skeleton } from "@/components/ui/skeleton";
import { computeWeeklyReview } from "@/lib/weekly-review";
import { getWeekDates } from "@/lib/session-history";
import { staggerContainer, fadeUp } from "@/lib/motion";

export function CoachView() {
  const { state, loading } = useLedgerData();

  if (loading) {
    return (
      <div className="space-y-4 pt-6">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  const weekDates = getWeekDates(new Date());
  const review = computeWeeklyReview(state.sessions, state.trades, weekDates);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-md pt-4 text-center"
    >
      <motion.p variants={fadeUp} className="text-xs uppercase tracking-wide text-ledger-muted">
        Weekly review
      </motion.p>
      <motion.h1 variants={fadeUp} className="mt-2 font-serif text-2xl font-medium">
        This week, in review.
      </motion.h1>

      {review.avgScore !== null && (
        <motion.div variants={fadeUp} className="mt-8 font-mono text-5xl font-bold text-brass">
          {review.avgScore}
        </motion.div>
      )}
      {review.avgScore !== null && (
        <motion.p variants={fadeUp} className="mt-1 text-xs uppercase tracking-wide text-ledger-muted">
          average score
        </motion.p>
      )}

      <div className="mt-8 space-y-3 text-left">
        {review.narrative.map((line, i) => (
          <motion.p key={i} variants={fadeUp} className="text-[15px] leading-relaxed text-ledger-text">
            {line}
          </motion.p>
        ))}
      </div>

      {review.gradeLetters.length > 0 && (
        <motion.div variants={fadeUp} className="mt-8 flex justify-center gap-2">
          {review.gradeLetters.map((g, i) => (
            <span
              key={i}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-panel-raised font-mono text-xs font-bold text-ledger-text"
            >
              {g}
            </span>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
