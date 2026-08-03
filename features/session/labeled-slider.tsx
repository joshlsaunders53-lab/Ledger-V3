import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function LabeledSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  lowHint,
  highHint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  lowHint?: string;
  highHint?: string;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <Label>{label}</Label>
        <span className="font-mono text-sm font-bold text-brass">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
      {(lowHint || highHint) && (
        <div className="mt-1.5 flex justify-between text-[10.5px] text-ledger-faint">
          <span>{lowHint}</span>
          <span>{highHint}</span>
        </div>
      )}
    </div>
  );
}
