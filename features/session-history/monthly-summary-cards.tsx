import { Card } from "@/components/ui/card";
import { fmtMoney } from "@/lib/calculations";
import type { MonthlySummary } from "@/lib/session-history";
import { cn } from "@/lib/utils";

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg" | "brass";
}) {
  return (
    <Card className="p-4">
      <div className="mb-1.5 text-[10.5px] uppercase tracking-wide text-ledger-muted">{label}</div>
      <div
        className={cn(
          "truncate font-mono text-lg font-bold",
          tone === "pos" && "text-teal",
          tone === "neg" && "text-clay",
          tone === "brass" && "text-brass"
        )}
      >
        {value}
      </div>
    </Card>
  );
}

export function MonthlySummaryCards({ summary }: { summary: MonthlySummary }) {
  if (summary.totalTrades === 0) {
    return (
      <div className="py-8 text-center text-sm italic text-ledger-muted">
        No trades logged this month yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <SummaryCard label="Monthly P&L" value={fmtMoney(summary.pnl)} tone={summary.pnl >= 0 ? "pos" : "neg"} />
      <SummaryCard label="Total trades" value={String(summary.totalTrades)} />
      <SummaryCard label="Win rate" value={summary.winRate + "%"} tone="brass" />
      <SummaryCard
        label="Average R"
        value={summary.avgR !== null ? (summary.avgR >= 0 ? "+" : "") + summary.avgR.toFixed(1) + "R" : "–"}
        tone={summary.avgR !== null ? (summary.avgR >= 0 ? "pos" : "neg") : undefined}
      />
      <SummaryCard
        label="Profit factor"
        value={summary.profitFactor === null ? "∞" : summary.profitFactor.toFixed(2)}
        tone={summary.profitFactor === null || summary.profitFactor >= 1 ? "pos" : "neg"}
      />
      <SummaryCard label="Largest win" value={fmtMoney(summary.largestWin)} tone="pos" />
      <SummaryCard label="Largest loss" value={fmtMoney(summary.largestLoss)} tone="neg" />
      <SummaryCard label="Best setup" value={summary.bestSetup?.label ?? "–"} tone="pos" />
      <SummaryCard label="Worst setup" value={summary.worstSetup?.label ?? "–"} tone="neg" />
      <SummaryCard label="Most common emotion" value={summary.mostCommonEmotion ?? "–"} />
      <SummaryCard label="Rules broken" value={String(summary.rulesBrokenCount)} tone={summary.rulesBrokenCount > 0 ? "neg" : "pos"} />
      <SummaryCard
        label="Discipline score"
        value={summary.disciplineScore !== null ? summary.disciplineScore + "%" : "–"}
        tone="brass"
      />
    </div>
  );
}
