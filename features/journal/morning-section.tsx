"use client";

import { Sunrise } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LabeledSlider } from "@/features/session/labeled-slider";
import { JournalFreeWriting } from "./journal-free-writing";
import { MOODS } from "@/lib/constants";
import type { MorningJournal } from "@/lib/types";
import type { SaveStatus } from "@/hooks/use-journal";
import { cn } from "@/lib/utils";

const EMPTY: MorningJournal = {
  mood: "",
  sleep: 5,
  energy: 5,
  stress: 5,
  confidence: 5,
  focus: "",
  goals: "",
  avoid: "",
  distraction: "",
  affirmation: "",
  freeWriting: "",
};

export function MorningSection({
  value,
  onChange,
  status,
}: {
  value: MorningJournal | null;
  onChange: (value: MorningJournal) => void;
  status: SaveStatus;
}) {
  const v = value ?? EMPTY;

  function set<K extends keyof MorningJournal>(key: K, val: MorningJournal[K]) {
    onChange({ ...v, [key]: val });
  }

  return (
    <Card>
      <CardHeader>
        <Sunrise className="h-[17px] w-[17px] text-brass" />
        <CardTitle>Morning</CardTitle>
        <span className="ml-auto text-[11px] text-ledger-faint">
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : ""}
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>How do I feel today?</Label>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => set("mood", mood)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  v.mood === mood ? "border-brass bg-brass/[.13] text-brass" : "border-hairline bg-panel-raised text-ledger-muted hover:border-ledger-muted"
                )}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        <LabeledSlider label="Sleep" min={0} value={v.sleep} onChange={(n) => set("sleep", n)} lowHint="Rough night" highHint="Fully rested" />
        <LabeledSlider label="Energy" value={v.energy} onChange={(n) => set("energy", n)} lowHint="Drained" highHint="Sharp" />
        <LabeledSlider label="Stress" value={v.stress} onChange={(n) => set("stress", n)} lowHint="Calm" highHint="Wound up" />
        <LabeledSlider label="Confidence" value={v.confidence} onChange={(n) => set("confidence", n)} lowHint="Unsure" highHint="Locked in" />

        <div>
          <Label htmlFor="focus">Today&apos;s focus</Label>
          <Input id="focus" className="mt-2" value={v.focus} onChange={(e) => set("focus", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="goals">Today&apos;s trading goals</Label>
          <Input id="goals" className="mt-2" value={v.goals} onChange={(e) => set("goals", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="avoid">Things I need to avoid today</Label>
          <Input id="avoid" className="mt-2" value={v.avoid} onChange={(e) => set("avoid", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="distraction">Biggest distraction today</Label>
          <Input id="distraction" className="mt-2" value={v.distraction} onChange={(e) => set("distraction", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="affirmation">Affirmation</Label>
          <Input id="affirmation" className="mt-2" value={v.affirmation} onChange={(e) => set("affirmation", e.target.value)} />
        </div>

        <div>
          <Label>What is on my mind today?</Label>
          <div className="mt-2.5">
            <JournalFreeWriting value={v.freeWriting} onChange={(t) => set("freeWriting", t)} placeholder="Write freely..." />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
