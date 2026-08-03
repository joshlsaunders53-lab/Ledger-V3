"use client";

import { Moon, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LabeledSlider } from "@/features/session/labeled-slider";
import { JournalFreeWriting } from "./journal-free-writing";
import { MOODS } from "@/lib/constants";
import type { EveningJournal } from "@/lib/types";
import type { SaveStatus } from "@/hooks/use-journal";
import { cn } from "@/lib/utils";

const EMPTY: EveningJournal = {
  mood: "",
  proudOf: "",
  frustrated: "",
  repeatedMistakes: "",
  learned: "",
  improveTomorrow: "",
  followedRules: null,
  wouldRepeatToday: null,
  dayRating: 5,
  gratitude: "",
  freeWriting: "",
};

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-semibold transition-colors",
          value === true ? "border-teal bg-teal/[.13] text-teal" : "border-hairline bg-panel-raised text-ledger-muted"
        )}
      >
        <Check className="h-3.5 w-3.5" /> Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-semibold transition-colors",
          value === false ? "border-clay bg-clay/[.13] text-clay" : "border-hairline bg-panel-raised text-ledger-muted"
        )}
      >
        <X className="h-3.5 w-3.5" /> No
      </button>
    </div>
  );
}

export function EveningSection({
  value,
  onChange,
  status,
}: {
  value: EveningJournal | null;
  onChange: (value: EveningJournal) => void;
  status: SaveStatus;
}) {
  const v = value ?? EMPTY;

  function set<K extends keyof EveningJournal>(key: K, val: EveningJournal[K]) {
    onChange({ ...v, [key]: val });
  }

  return (
    <Card>
      <CardHeader>
        <Moon className="h-[17px] w-[17px] text-brass" />
        <CardTitle>Evening</CardTitle>
        <span className="ml-auto text-[11px] text-ledger-faint">
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : ""}
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>How do I feel now?</Label>
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

        <div>
          <Label htmlFor="proudOf">What am I proud of?</Label>
          <Input id="proudOf" className="mt-2" value={v.proudOf} onChange={(e) => set("proudOf", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="frustrated">What frustrated me?</Label>
          <Input id="frustrated" className="mt-2" value={v.frustrated} onChange={(e) => set("frustrated", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="repeatedMistakes">What mistakes repeated?</Label>
          <Input id="repeatedMistakes" className="mt-2" value={v.repeatedMistakes} onChange={(e) => set("repeatedMistakes", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="learned">What did I learn?</Label>
          <Input id="learned" className="mt-2" value={v.learned} onChange={(e) => set("learned", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="improveTomorrow">What will I improve tomorrow?</Label>
          <Input id="improveTomorrow" className="mt-2" value={v.improveTomorrow} onChange={(e) => set("improveTomorrow", e.target.value)} />
        </div>

        <div>
          <Label>Did I follow my rules?</Label>
          <div className="mt-2.5">
            <YesNoToggle value={v.followedRules} onChange={(val) => set("followedRules", val)} />
          </div>
        </div>
        <div>
          <Label>Would I trade today exactly the same again?</Label>
          <div className="mt-2.5">
            <YesNoToggle value={v.wouldRepeatToday} onChange={(val) => set("wouldRepeatToday", val)} />
          </div>
        </div>

        <LabeledSlider label="Overall day rating" value={v.dayRating} onChange={(n) => set("dayRating", n)} lowHint="Rough" highHint="Great" />

        <div>
          <Label htmlFor="gratitude">Gratitude</Label>
          <Input id="gratitude" className="mt-2" value={v.gratitude} onChange={(e) => set("gratitude", e.target.value)} />
        </div>

        <div>
          <Label>Anything else about today?</Label>
          <div className="mt-2.5">
            <JournalFreeWriting value={v.freeWriting} onChange={(t) => set("freeWriting", t)} placeholder="Write freely..." />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
