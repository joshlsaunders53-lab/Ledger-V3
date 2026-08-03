"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, Layers, Moon, ShieldCheck } from "lucide-react";
import { fmtMoney, fmtShort } from "@/lib/calculations";
import type {
  computeWeekdayPerformance,
  computeSessionOfDayPerformance,
  computeSetupPerformance,
  computeSleepStressCorrelation,
  computeDisciplineMetrics,
  computeMonthlyPerformance,
} from "@/lib/dashboard";

const axisTick = { fill: "var(--text-faint)", fontSize: 10.5, fontFamily: "var(--font-jetbrains-mono)" };

function EmptyState() {
  return (
    <div className="flex h-[180px] items-center justify-center text-sm italic text-ledger-muted">
      Not enough trades yet.
    </div>
  );
}

function TooltipBox({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-hairline bg-ink/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <div className="font-mono font-semibold text-ledger-text">{fmtMoney(payload[0].value)}</div>
    </div>
  );
}

export function MonthlyPerformanceCard({ data }: { data: ReturnType<typeof computeMonthlyPerformance> }) {
  return (
    <Card>
      <CardHeader>
        <CalendarDays className="h-[17px] w-[17px] text-brass" />
        <CardTitle>Monthly performance</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--hairline-soft)" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={axisTick} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<TooltipBox />} />
                <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? "var(--teal)" : "var(--clay)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WeekdayPerformanceCard({ data }: { data: ReturnType<typeof computeWeekdayPerformance> }) {
  const hasData = data.some((d) => d.trades > 0);
  return (
    <Card>
      <CardHeader>
        <CalendarDays className="h-[17px] w-[17px] text-brass" />
        <CardTitle>Win rate &amp; P&amp;L by weekday</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState />
        ) : (
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--hairline-soft)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={axisTick} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<TooltipBox />} />
                <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? "var(--teal)" : "var(--clay)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SessionOfDayCard({ data }: { data: ReturnType<typeof computeSessionOfDayPerformance> }) {
  return (
    <Card>
      <CardHeader>
        <Clock className="h-[17px] w-[17px] text-brass" />
        <CardTitle>Performance by session</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.hasData ? (
          <EmptyState />
        ) : (
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--hairline-soft)" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={axisTick} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<TooltipBox />} />
                <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                  {data.rows.map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? "var(--teal)" : "var(--clay)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SetupPerformanceCard({ data }: { data: ReturnType<typeof computeSetupPerformance> }) {
  return (
    <Card>
      <CardHeader>
        <Layers className="h-[17px] w-[17px] text-brass" />
        <CardTitle>Performance by setup</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.hasData ? (
          <div className="flex h-[180px] flex-col items-center justify-center gap-1 text-center text-sm italic text-ledger-muted">
            <span>Not enough trades yet.</span>
            <span className="text-xs not-italic text-ledger-faint">Tag a setup when logging a trade to build this out.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {data.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-md bg-panel-raised px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-ledger-text">{row.label}</div>
                  <div className="text-[11px] text-ledger-faint">
                    {row.trades} trade{row.trades === 1 ? "" : "s"} · {row.winRate}% win rate
                  </div>
                </div>
                <div className={`font-mono text-sm font-bold ${row.pnl >= 0 ? "text-teal" : "text-clay"}`}>
                  {fmtMoney(row.pnl)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PsychologyCard({ data }: { data: ReturnType<typeof computeSleepStressCorrelation> }) {
  return (
    <Card>
      <CardHeader>
        <Moon className="h-[17px] w-[17px] text-brass" />
        <CardTitle>Sleep &amp; stress vs. P&amp;L</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.hasData ? (
          <div className="flex h-[180px] flex-col items-center justify-center gap-1 text-center text-sm italic text-ledger-muted">
            <span>Not enough trades yet.</span>
            <span className="text-xs not-italic text-ledger-faint">
              Needs a few days with both a pre-session check-in and logged trades.
            </span>
          </div>
        ) : (
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--hairline-soft)" />
                <XAxis
                  type="number"
                  dataKey="sleep"
                  name="Sleep"
                  domain={[0, 10]}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Sleep", position: "insideBottom", offset: -2, fill: "var(--text-faint)", fontSize: 10 }}
                />
                <YAxis type="number" dataKey="pnl" name="P&L" tickFormatter={fmtShort} tick={axisTick} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="rounded-md border border-hairline bg-ink/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
                        <div className="text-ledger-faint">{p.date}</div>
                        <div className="mt-0.5 text-ledger-text">Sleep {p.sleep}/10 · Stress {p.stress}/10</div>
                        <div className="font-mono font-semibold text-ledger-text">{fmtMoney(p.pnl)}</div>
                      </div>
                    );
                  }}
                />
                <Scatter data={data.points} fill="var(--brass)" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DisciplineMetricsCard({ data }: { data: ReturnType<typeof computeDisciplineMetrics> }) {
  return (
    <Card>
      <CardHeader>
        <ShieldCheck className="h-[17px] w-[17px] text-brass" />
        <CardTitle>Discipline</CardTitle>
      </CardHeader>
      <CardContent>
        {data.ruleFollowingPct === null ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-panel-raised p-3">
              <div className="text-[10px] uppercase tracking-wide text-ledger-muted">Rule-following</div>
              <div className="mt-1 font-mono text-lg font-bold text-brass">{data.ruleFollowingPct}%</div>
            </div>
            <div className="rounded-md bg-panel-raised p-3">
              <div className="text-[10px] uppercase tracking-wide text-ledger-muted">Rules broken</div>
              <div className="mt-1 font-mono text-lg font-bold text-clay">{data.rulesBrokenCount}</div>
            </div>
            <div className="col-span-2 rounded-md bg-panel-raised p-3">
              <div className="text-[10px] uppercase tracking-wide text-ledger-muted">Most common mistake</div>
              <div className="mt-1 text-sm text-ledger-text">{data.mostCommonMistake ?? "None logged"}</div>
            </div>
            {data.winningBehaviourPct !== null && (
              <div className="col-span-2 rounded-md bg-panel-raised p-3">
                <div className="text-[10px] uppercase tracking-wide text-ledger-muted">
                  Most common winning behaviour
                </div>
                <div className="mt-1 text-sm text-ledger-text">
                  Followed the plan on {data.winningBehaviourPct}% of winning trades
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
