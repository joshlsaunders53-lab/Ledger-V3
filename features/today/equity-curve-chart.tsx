"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { Trade } from "@/lib/types";
import { computeEquityCurve, fmtMoney, fmtShort } from "@/lib/calculations";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-hairline bg-ink/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <div className="text-ledger-faint">{label}</div>
      <div className="mt-0.5 font-mono font-semibold text-ledger-text">{fmtMoney(payload[0].value)}</div>
    </div>
  );
}

export function DashboardEquityCurve({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm italic text-ledger-muted">
        Not enough trades yet.
      </div>
    );
  }

  const points = computeEquityCurve(trades);
  const last = points[points.length - 1].cumulative;
  const color = last >= 0 ? "var(--teal)" : "var(--clay)";

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="dashEquityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--hairline-soft)" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis
            tickFormatter={fmtShort}
            tick={{ fill: "var(--text-faint)", fontSize: 10.5, fontFamily: "var(--font-jetbrains-mono)" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <ReferenceLine y={0} stroke="var(--hairline)" strokeDasharray="3 3" />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={color}
            strokeWidth={2.25}
            fill="url(#dashEquityFill)"
            animationDuration={800}
            dot={false}
            activeDot={{ r: 5, fill: color, stroke: "var(--ink)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
