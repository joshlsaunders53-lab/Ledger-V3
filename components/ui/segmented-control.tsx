"use client";

import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full border border-hairline bg-panel-raised p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-brass text-primary-foreground"
              : "text-ledger-muted hover:text-ledger-text"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
