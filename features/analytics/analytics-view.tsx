"use client";

import { motion } from "framer-motion";
import { useLedgerData } from "@/hooks/use-ledger-data";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, fadeUp } from "@/lib/motion";
import {
  computeMonthlyPerformance,
  computeWeekdayPerformance,
  computeSessionOfDayPerformance,
  computeSetupPerformance,
  computeSleepStressCorrelation,
  computeDisciplineMetrics,
} from "@/lib/dashboard";
import {
  MonthlyPerformanceCard,
  WeekdayPerformanceCard,
  SessionOfDayCard,
  SetupPerformanceCard,
  PsychologyCard,
  DisciplineMetricsCard,
} from "./analytics-widgets";

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-[220px] w-full rounded-lg" />
      <Skeleton className="h-[380px] w-full rounded-lg" />
    </div>
  );
}

export function AnalyticsView() {
  const { state, loading, syncError } = useLedgerData();

  if (loading) return <AnalyticsSkeleton />;

  const monthlyPerf = computeMonthlyPerformance(state.trades);
  const weekdayPerf = computeWeekdayPerformance(state.trades);
  const sessionOfDay = computeSessionOfDayPerformance(state.trades);
  const setupPerf = computeSetupPerformance(state.trades);
  const psychology = computeSleepStressCorrelation(state.trades, state.sessions);
  const discipline = computeDisciplineMetrics(state.trades);

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
        <h1 className="font-serif text-2xl font-medium">Analytics.</h1>
        <p className="mt-1 text-sm text-ledger-muted">The deeper breakdowns, out of the Dashboard's way.</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <MonthlyPerformanceCard data={monthlyPerf} />
      </motion.div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <motion.div variants={fadeUp}>
          <WeekdayPerformanceCard data={weekdayPerf} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <SessionOfDayCard data={sessionOfDay} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <SetupPerformanceCard data={setupPerf} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <PsychologyCard data={psychology} />
        </motion.div>
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <DisciplineMetricsCard data={discipline} />
        </motion.div>
      </div>
    </motion.div>
  );
}
