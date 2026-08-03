"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  chartDailyCumulativePnl,
  chartPnlByWeekday,
  chartWinRateOverTime,
  chartSetupsPerformance,
  chartEmotionsVsProfitability,
  chartDisciplineTrend,
} from "@/lib/session-history";
import { fmtMoney, fmtShort } from "@/lib/calculations";
import type { Trade } from "@/lib/types";
import {
  TrendingUp,
  CalendarDays,
  Target,
  Layers,
  Activity,
  ShieldCheck,
} from "lucide-react";

const axisTick = { fill: "var(--text-faint)", fontSize: 10.5, fontFamily: "var(--font-jetbrains-mono)" };

function ChartCard({
  icon: Icon,
  title,
  empty,
  children,
}: {
  icon: React.ElementType;
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <Icon className="h-[17px] w-[17px] text-brass" />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="flex h-[180px] items-center justify-center text-sm italic text-ledger-muted">
            Not enough data yet.
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function Tip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-hairline bg-ink/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {label && <div className="text-ledger-faint">{label}</div>}
      <div className="mt-0.5 font-mono font-semibold text-ledger-text">
        {formatter ? formatter(payload[0].value) : payload[0].value}
      </div>
    </div>
  );
}

export function MonthlyCharts({ monthTrades }: { monthTrades: Trade[] }) {
  const cumulative = chartDailyCumulativePnl(monthTrades);
  const byWeekday = chartPnlByWeekday(monthTrades);
  const winRateOverTime = chartWinRateOverTime(monthTrades);
  const setups = chartSetupsPerformance(monthTrades);
  const emotions = chartEmotionsVsProfitability(monthTrades);
  const discipline = chartDisciplineTrend(monthTrades);

  return (
    <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
      <ChartCard icon={TrendingUp} title="Daily cumulative P&L" empty={cumulative.length === 0}>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulative} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="histCumFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brass)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--brass)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--hairline-soft)" vertical={false} />
              <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={axisTick} axisLine={false} tickLine={false} width={48} />
              <ReferenceLine y={0} stroke="var(--hairline)" strokeDasharray="3 3" />
              <Tooltip content={<Tip formatter={fmtMoney} />} />
              <Area type="monotone" dataKey="cumulative" stroke="var(--brass)" strokeWidth={2} fill="url(#histCumFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard icon={CalendarDays} title="P&L by weekday" empty={byWeekday.every((d) => d.pnl === 0)}>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byWeekday} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--hairline-soft)" vertical={false} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={axisTick} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<Tip formatter={fmtMoney} />} />
              <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                {byWeekday.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? "var(--teal)" : "var(--clay)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard icon={Target} title="Win rate over time" empty={winRateOverTime.length === 0}>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={winRateOverTime} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--hairline-soft)" vertical={false} />
              <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => v + "%"} tick={axisTick} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<Tip formatter={(v: number) => v + "%"} />} />
              <Line type="monotone" dataKey="winRate" stroke="var(--teal)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard icon={Layers} title="Setup performance" empty={setups.length === 0}>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={setups} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--hairline-soft)" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtShort} tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ ...axisTick, fontFamily: "var(--font-inter)" }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<Tip formatter={fmtMoney} />} />
              <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                {setups.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? "var(--teal)" : "var(--clay)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard icon={Activity} title="Emotions vs. profitability" empty={emotions.length === 0}>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={emotions} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--hairline-soft)" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtShort} tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ ...axisTick, fontFamily: "var(--font-inter)" }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<Tip formatter={fmtMoney} />} />
              <Bar dataKey="avgPnl" radius={[4, 4, 4, 4]}>
                {emotions.map((d, i) => (
                  <Cell key={i} fill={d.avgPnl >= 0 ? "var(--teal)" : "var(--clay)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard icon={ShieldCheck} title="Discipline score trend" empty={discipline.length === 0}>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={discipline} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--hairline-soft)" vertical={false} />
              <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => v + "%"} tick={axisTick} axisLine={false} tickLine={false} width={40} />
              <ReferenceLine y={80} stroke="var(--teal-dim)" strokeDasharray="3 3" />
              <Tooltip content={<Tip formatter={(v: number) => v + "%"} />} />
              <Line type="monotone" dataKey="discipline" stroke="var(--brass)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
