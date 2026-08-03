import { cn } from "@/lib/utils";

export function DisciplineRing({
  score,
  size = 22,
  strokeWidth = 2.5,
}: {
  score: number | null;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = score ?? 0;
  const offset = circumference * (1 - pct / 100);

  const color =
    score === null
      ? "var(--text-faint)"
      : score >= 80
        ? "var(--teal)"
        : score >= 50
          ? "var(--brass)"
          : "var(--clay)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--hairline)"
        strokeWidth={strokeWidth}
      />
      {score !== null && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      )}
    </svg>
  );
}

export function DisciplineBadge({ score, className }: { score: number | null; className?: string }) {
  const color =
    score === null
      ? "text-ledger-faint"
      : score >= 80
        ? "text-teal"
        : score >= 50
          ? "text-brass"
          : "text-clay";
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs font-semibold", color, className)}>
      <DisciplineRing score={score} size={14} strokeWidth={2} />
      {score === null ? "–" : score + "%"}
    </span>
  );
}
