import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange } from "lucide-react";
import { fmtMoney, fmtShort } from "@/lib/calculations";
import type { WeeklySummary } from "@/lib/session-history";
import { cn } from "@/lib/utils";

function Cell({ value, label, tone }: { value: string; label: string; tone?: "pos" | "neg" | "brass" }) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "whitespace-nowrap font-mono text-base font-bold sm:text-lg",
          tone === "pos" && "text-teal",
          tone === "neg" && "text-clay",
          tone === "brass" && "text-brass"
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-ledger-muted">{label}</div>
    </div>
  );
}

export function WeeklySummaryStrip({ summary }: { summary: WeeklySummary }) {
  const hasTrades = summary.totalTrades > 0;

  return (
    <Card className="mb-5">
      <CardHeader>
        <CalendarRange className="h-[17px] w-[17px] text-brass" />
        <CardTitle>This week</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4 lg:grid-cols-8">
        <Cell
          value={hasTrades ? fmtMoney(summary.pnl) : "–"}
          label="Weekly P&L"
          tone={hasTrades ? (summary.pnl >= 0 ? "pos" : "neg") : undefined}
        />
        <Cell value={hasTrades ? summary.winRate + "%" : "–"} label="Win rate" tone="brass" />
        <Cell
          value={summary.avgR !== null ? (summary.avgR >= 0 ? "+" : "") + summary.avgR.toFixed(1) + "R" : "–"}
          label="Avg R"
          tone={summary.avgR !== null ? (summary.avgR >= 0 ? "pos" : "neg") : undefined}
        />
        <Cell value={String(summary.totalTrades)} label="Total trades" />
        <Cell
          value={summary.bestDay ? fmtShort(summary.bestDay.pnl) : "–"}
          label="Best day"
          tone={summary.bestDay ? "pos" : undefined}
        />
        <Cell
          value={summary.worstDay ? fmtShort(summary.worstDay.pnl) : "–"}
          label="Worst day"
          tone={summary.worstDay ? "neg" : undefined}
        />
        <Cell
          value={summary.disciplinePct !== null ? summary.disciplinePct + "%" : "–"}
          label="Discipline"
          tone="brass"
        />
        <Cell
          value={summary.consistencyScore !== null ? summary.consistencyScore + "%" : "–"}
          label="Consistency"
          tone="brass"
        />
      </div>
    </Card>
  );
}
