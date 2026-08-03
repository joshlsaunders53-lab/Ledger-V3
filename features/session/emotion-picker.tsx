import { EMOTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const EMOJI: Record<string, string> = {
  Calm: "😌",
  Confident: "💪",
  Anxious: "😰",
  FOMO: "🏃",
  Revenge: "😤",
  Impatient: "⏱️",
  Greedy: "🤑",
  Bored: "😐",
  Tilted: "🌀",
};

export function EmotionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emotion: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {EMOTIONS.map((emotion) => {
        const active = value === emotion;
        return (
          <button
            key={emotion}
            type="button"
            onClick={() => onChange(emotion)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "border-brass bg-brass/[.13] text-brass"
                : "border-hairline bg-panel-raised text-ledger-muted hover:border-ledger-muted"
            )}
          >
            <span className="text-base leading-none">{EMOJI[emotion] ?? "•"}</span>
            {emotion}
          </button>
        );
      })}
    </div>
  );
}
