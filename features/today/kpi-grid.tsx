import { fmtMoney } from "@/lib/calculations";
import { disciplineLabel } from "@/lib/coach";
import type { DashboardTopMetrics } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "pos" | "neg" | "brass";
}) {
  return (
    <div className="rounded-lg border border-hairline bg-panel-raised p-4">
      <div className="text-[10.5px] uppercase tracking-wide text-ledger-muted">{label}</div>
      <div
        className={cn(
          "mt-2 truncate font-mono text-xl font-bold",
          tone === "pos" && "text-teal",
          tone === "neg" && "text-clay",
          tone === "brass" && "text-brass"
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-ledger-faint">{sub}</div>}
    </div>
  );
}

function toneFor(n: number): "pos" | "neg" {
  return n >= 0 ? "pos" : "neg";
}

export function KpiGrid({ m }: { m: DashboardTopMetrics }) {
  const pf =
    m.totalTrades === 0
      ? "–"
      : m.profitFactorInfinite
        ? "∞"
        : m.profitFactor !== null
          ? m.profitFactor.toFixed(2)
          : "–";

  const streakLabel =
    m.currentStreak.count === 0 || !m.currentStreak.direction
      ? "–"
      : (m.currentStreak.direction === "win" ? "🔥 " : "❄️ ") + m.currentStreak.count;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Kpi label="Account balance" value={fmtMoney(m.accountBalance)} />
      <Kpi label="Today's P&L" value={fmtMoney(m.dailyPnl)} tone={toneFor(m.dailyPnl)} />
      <Kpi label="Weekly P&L" value={fmtMoney(m.weeklyPnl)} tone={toneFor(m.weeklyPnl)} />
      <Kpi label="Monthly P&L" value={fmtMoney(m.monthlyPnl)} tone={toneFor(m.monthlyPnl)} />
      <Kpi label="Win rate" value={m.winRate !== null ? m.winRate + "%" : "–"} tone="brass" />
      <Kpi label="Profit factor" value={pf} tone={pf === "–" ? undefined : "brass"} />
      <Kpi label="Average R" value={m.avgRR !== null ? m.avgRR.toFixed(2) + "R" : "–"} />
      <Kpi
        label="Discipline score"
        value={m.disciplineScore !== null ? m.disciplineScore + "%" : "–"}
        sub={m.totalTrades > 0 ? disciplineLabel(m.disciplineScore) : undefined}
        tone="brass"
      />
      <Kpi label="Current streak" value={streakLabel} />
    </div>
  );
}
