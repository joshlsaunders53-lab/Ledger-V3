"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, History as HistoryIcon } from "lucide-react";
import { useLedgerData } from "@/hooks/use-ledger-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { computeRiskUnit } from "@/lib/calculations";
import { computeTopMetrics } from "@/lib/dashboard";
import { KpiGrid } from "./kpi-grid";
import { DashboardEquityCurve } from "./equity-curve-chart";
import { RecentTradesList } from "./recent-trades";
import type { Trade } from "@/lib/types";

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-[280px] w-full rounded-lg" />
      <Skeleton className="h-[320px] w-full rounded-lg" />
      <Skeleton className="h-[300px] w-full rounded-lg" />
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 18) return "Good afternoon.";
  return "Good evening.";
}

export function TodayView() {
  const router = useRouter();
  const { state, loading, syncError } = useLedgerData();

  if (loading) return <DashboardSkeleton />;

  const riskUnit = computeRiskUnit(state.trades);
  const metrics = computeTopMetrics(state.trades, state.startingBalance);

  function openTrade(trade: Trade) {
    router.push(`/trades/${trade.id}`);
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
      {syncError && (
        <motion.div
          variants={fadeUp}
          className="rounded-md border border-clay-dim bg-clay/10 px-4 py-2.5 text-sm text-clay"
        >
          {syncError}
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <h1 className="font-serif text-2xl font-medium">{greeting()}</h1>
      </motion.div>

      <motion.div variants={fadeUp}>
        <KpiGrid m={metrics} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <TrendingUp className="h-[17px] w-[17px] text-brass" />
            <CardTitle>Equity curve</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardEquityCurve trades={state.trades} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <HistoryIcon className="h-[17px] w-[17px] text-brass" />
            <CardTitle>Recent trades</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTradesList trades={state.trades} riskUnit={riskUnit} onSelectTrade={openTrade} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
