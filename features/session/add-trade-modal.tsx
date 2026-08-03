"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, ArrowDownRight, Check, X, ImagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LabeledSlider } from "./labeled-slider";
import { EmotionPicker } from "./emotion-picker";
import { addTradeSchema, type AddTradeFormValues } from "@/lib/validation";
import { SETUPS } from "@/lib/constants";
import type { TradeScreenshots } from "@/lib/types";
import type { NewTradeFields } from "@/lib/db/trades";
import { todayStr } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const DEFAULT_VALUES: AddTradeFormValues = {
  symbol: "",
  direction: "long",
  pnl: 0,
  followedPlan: true,
};

const SCREENSHOT_SLOTS: { key: keyof TradeScreenshots; label: string }[] = [
  { key: "before", label: "Before" },
  { key: "during", label: "During" },
  { key: "after", label: "After" },
  { key: "markup", label: "Markup" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-2 text-[10.5px] font-semibold uppercase tracking-wide text-ledger-muted">
      {children}
    </div>
  );
}

export function AddTradeModal({
  open,
  onOpenChange,
  onSave,
  initialDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (fields: NewTradeFields, screenshots: Partial<Record<keyof TradeScreenshots, File>>) => Promise<void> | void;
  initialDate?: string;
}) {
  const { watch, setValue, register, handleSubmit, reset } = useForm<AddTradeFormValues>({
    resolver: zodResolver(addTradeSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });
  const values = watch();
  const formRef = useRef<HTMLFormElement>(null);

  const [date, setDate] = useState(initialDate ?? todayStr());
  const [account, setAccount] = useState("");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [size, setSize] = useState("");
  const [duration, setDuration] = useState("");
  const [setup, setSetup] = useState("");
  const [executionScore, setExecutionScore] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [emotionBefore, setEmotionBefore] = useState("");
  const [emotionAfter, setEmotionAfter] = useState("");
  const [mistake, setMistake] = useState("");
  const [notes, setNotes] = useState("");
  const [reflection, setReflection] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState<Partial<Record<keyof TradeScreenshots, File>>>({});
  const [screenshotPreviews, setScreenshotPreviews] = useState<Partial<Record<keyof TradeScreenshots, string>>>({});
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
      setDate(initialDate ?? todayStr());
      setAccount("");
      setEntry("");
      setExit("");
      setStop("");
      setTarget("");
      setSize("");
      setDuration("");
      setSetup("");
      setExecutionScore(5);
      setConfidence(5);
      setEmotionBefore("");
      setEmotionAfter("");
      setMistake("");
      setNotes("");
      setReflection("");
      setTagsText("");
      setScreenshotFiles({});
      setScreenshotPreviews({});
    } else {
      setDate(initialDate ?? todayStr());
    }
  }, [open, reset, initialDate]);

  function handleFile(kind: keyof TradeScreenshots, file: File | undefined) {
    if (!file) return;
    setScreenshotFiles((s) => ({ ...s, [kind]: file }));
    setScreenshotPreviews((s) => ({ ...s, [kind]: URL.createObjectURL(file) }));
  }

  async function onSubmit(v: AddTradeFormValues) {
    const fields: NewTradeFields = {
      id: crypto.randomUUID(),
      date,
      symbol: v.symbol.toUpperCase(),
      direction: v.direction,
      entry: entry ? parseFloat(entry) : undefined,
      exit: exit ? parseFloat(exit) : undefined,
      stop: stop ? parseFloat(stop) : undefined,
      target: target ? parseFloat(target) : undefined,
      size: size ? parseFloat(size) : undefined,
      pnl: v.pnl,
      account: account || undefined,
      setup,
      durationMinutes: duration ? parseInt(duration, 10) : undefined,
      executionScore,
      emotionBefore: emotionBefore || undefined,
      emotionAfter: emotionAfter || undefined,
      mistake: mistake || undefined,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes,
      reflection,
      confidence,
      followedPlan: v.followedPlan,
      mistakes: v.followedPlan ? [] : ["Broke trading plan"],
    };
    setSaving(true);
    try {
      await onSave(fields, screenshotFiles);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[88vh] overflow-y-auto"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Log a trade</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          {/* Basics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tradeDate">Date</Label>
              <Input id="tradeDate" type="date" max={todayStr()} className="mt-2" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="symbol">Instrument</Label>
              <Input id="symbol" autoFocus placeholder="NQ" className="mt-2" {...register("symbol")} />
            </div>
          </div>
          {date !== todayStr() && (
            <p className="mb-3 mt-1.5 text-xs text-brass">
              Logging for {new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}, not today.
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="account">Account</Label>
              <Input id="account" placeholder="e.g. Personal, Prop Firm A" className="mt-2" value={account} onChange={(e) => setAccount(e.target.value)} />
            </div>
            <div>
              <Label>Direction</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["long", "short"] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setValue("direction", dir, { shouldValidate: true })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-md border py-2.5 text-sm font-semibold capitalize transition-colors",
                      values.direction === dir
                        ? dir === "long"
                          ? "border-teal bg-teal/[.13] text-teal"
                          : "border-clay bg-clay/[.13] text-clay"
                        : "border-hairline bg-panel-raised text-ledger-muted hover:border-ledger-muted"
                    )}
                  >
                    {dir === "long" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Execution */}
          <SectionLabel>Execution</SectionLabel>
          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <Label htmlFor="entry">Entry</Label>
              <Input id="entry" type="number" inputMode="decimal" step="any" className="mt-2" value={entry} onChange={(e) => setEntry(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="exit">Exit</Label>
              <Input id="exit" type="number" inputMode="decimal" step="any" className="mt-2" value={exit} onChange={(e) => setExit(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="stop">Stop</Label>
              <Input id="stop" type="number" inputMode="decimal" step="any" className="mt-2" value={stop} onChange={(e) => setStop(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="target">Target</Label>
              <Input id="target" type="number" inputMode="decimal" step="any" className="mt-2" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <div>
              <Label htmlFor="size">Contracts</Label>
              <Input id="size" type="number" inputMode="decimal" step="any" className="mt-2" value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="duration">Duration (min)</Label>
              <Input id="duration" type="number" inputMode="numeric" className="mt-2" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pnl">P&amp;L ($)</Label>
              <Input id="pnl" type="number" inputMode="decimal" step="any" placeholder="0" className="mt-2" {...register("pnl", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="mt-3">
            <Label htmlFor="setup">Setup</Label>
            <select
              id="setup"
              className="mt-2 flex h-10 w-full rounded-md border border-hairline bg-panel-raised px-3 text-sm text-ledger-text outline-none focus:border-brass"
              value={setup}
              onChange={(e) => setSetup(e.target.value)}
            >
              <option value="">None</option>
              {SETUPS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Screenshots */}
          <SectionLabel>Screenshots</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {SCREENSHOT_SLOTS.map((slot) => (
              <div key={slot.key}>
                <input
                  ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(slot.key, e.target.files?.[0])}
                />
                {screenshotPreviews[slot.key] ? (
                  <div className="relative overflow-hidden rounded-md border border-hairline">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={screenshotPreviews[slot.key]} alt={slot.label} className="h-16 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotFiles((s) => ({ ...s, [slot.key]: undefined }));
                        setScreenshotPreviews((s) => ({ ...s, [slot.key]: undefined }));
                      }}
                      className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-ledger-text hover:text-clay"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[slot.key]?.click()}
                    className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-hairline text-[10px] text-ledger-muted transition-colors hover:border-brass hover:text-brass"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    {slot.label}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Psychology */}
          <SectionLabel>Psychology</SectionLabel>
          <div className="space-y-4">
            <LabeledSlider label="Execution quality" value={executionScore} onChange={setExecutionScore} lowHint="Sloppy" highHint="Textbook" />
            <LabeledSlider label="Confidence before" value={confidence} onChange={setConfidence} lowHint="Unsure" highHint="Locked in" />
            <div>
              <Label>Emotion before</Label>
              <div className="mt-2">
                <EmotionPicker value={emotionBefore} onChange={setEmotionBefore} />
              </div>
            </div>
            <div>
              <Label>Emotion after</Label>
              <div className="mt-2">
                <EmotionPicker value={emotionAfter} onChange={setEmotionAfter} />
              </div>
            </div>
          </div>

          {/* Reflection */}
          <SectionLabel>Reflection</SectionLabel>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mistake">Mistake (if any)</Label>
              <Input id="mistake" placeholder="e.g. Sized up after a loss" className="mt-2" value={mistake} onChange={(e) => setMistake(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" className="mt-2" placeholder="What happened, what you saw" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="reflection">Lesson learned</Label>
              <Textarea id="reflection" className="mt-2" placeholder="What would you do differently?" value={reflection} onChange={(e) => setReflection(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" placeholder="comma, separated, tags" className="mt-2" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
            </div>
          </div>

          <div className="mt-4">
            <Label>Did you follow your plan?</Label>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue("followedPlan", true, { shouldValidate: true })}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md border py-2.5 text-sm font-semibold transition-colors",
                  values.followedPlan ? "border-teal bg-teal/[.13] text-teal" : "border-hairline bg-panel-raised text-ledger-muted"
                )}
              >
                <Check className="h-4 w-4" /> Yes
              </button>
              <button
                type="button"
                onClick={() => setValue("followedPlan", false, { shouldValidate: true })}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md border py-2.5 text-sm font-semibold transition-colors",
                  !values.followedPlan ? "border-clay bg-clay/[.13] text-clay" : "border-hairline bg-panel-raised text-ledger-muted"
                )}
              >
                <X className="h-4 w-4" /> No
              </button>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="mt-5 w-full py-5">
            {saving ? "Saving..." : "Save trade"}
            {!saving && (
              <kbd className="ml-2 rounded border border-black/20 bg-black/10 px-1.5 py-0.5 font-mono text-[10px] text-primary-foreground/70">⌘⏎</kbd>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
