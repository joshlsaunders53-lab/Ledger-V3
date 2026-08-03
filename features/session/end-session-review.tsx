"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeCoachVerdict } from "@/lib/coach";
import type { Trade } from "@/lib/types";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "var(--teal)";
  if (grade.startsWith("B")) return "var(--brass)";
  if (grade.startsWith("C")) return "var(--brass)";
  return "var(--clay)";
}

export function EndSessionReview({
  trades,
  objective,
  onFinish,
}: {
  trades: Trade[];
  objective: string;
  onFinish: (objectiveMet: boolean | null) => void;
}) {
  const [objectiveMet, setObjectiveMet] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);

  if (!answered) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto flex max-w-sm flex-col items-center pt-10 text-center"
      >
        <motion.p variants={fadeUp} className="text-xs uppercase tracking-wide text-ledger-muted">
          Session complete
        </motion.p>
        <motion.h1 variants={fadeUp} className="mt-2 font-serif text-2xl font-medium">
          Did you meet today's objective?
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-2 text-sm text-ledger-muted">
          &ldquo;{objective}&rdquo;
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 grid w-full grid-cols-2 gap-3">
          <Button
            onClick={() => {
              setObjectiveMet(true);
              setAnswered(true);
            }}
            className="py-6"
          >
            <Check className="h-4 w-4" /> Yes
          </Button>
          <Button
            onClick={() => {
              setObjectiveMet(false);
              setAnswered(true);
            }}
            variant="ghost"
            className="py-6"
          >
            <X className="h-4 w-4" /> No
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  const verdict = computeCoachVerdict(trades, objectiveMet, objective);
  const color = gradeColor(verdict.grade);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto flex max-w-sm flex-col items-center pt-6 text-center"
    >
      <motion.p variants={fadeUp} className="text-xs uppercase tracking-wide text-ledger-muted">
        Today's grade
      </motion.p>
      <motion.div
        variants={fadeUp}
        className="mt-2 font-serif text-8xl font-medium"
        style={{ color }}
      >
        {verdict.grade}
      </motion.div>

      <div className="mt-8 space-y-2">
        {verdict.narrative.map((line, i) => (
          <motion.p
            key={i}
            variants={fadeUp}
            className={cn(
              "text-[15px] leading-relaxed",
              i === verdict.narrative.length - 1
                ? "mt-3 font-medium text-ledger-text"
                : "text-ledger-muted"
            )}
          >
            {line}
          </motion.p>
        ))}
      </div>

      <motion.div variants={fadeUp} className="mt-10 w-full">
        <Button onClick={() => onFinish(objectiveMet)} className="w-full py-6 text-base">
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}
