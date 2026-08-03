"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2,
  ImagePlus,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { useLedgerData } from "@/hooks/use-ledger-data";
import { createClient } from "@/lib/supabase/client";
import { getSignedScreenshotUrl } from "@/lib/db/storage";
import { fmtMoney, fmtR, computeRiskUnit } from "@/lib/calculations";
import type { TradeScreenshots } from "@/lib/types";
import type { TradeEditableFields } from "@/lib/db/trades";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { DisciplineRing } from "@/features/session-history/discipline-ring";
import { EmotionPicker } from "@/features/session/emotion-picker";
import { LabeledSlider } from "@/features/session/labeled-slider";
import { SETUPS } from "@/lib/constants";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SLOTS: { key: keyof TradeScreenshots; label: string }[] = [
  { key: "before", label: "Before" },
  { key: "during", label: "During" },
  { key: "after", label: "After" },
  { key: "markup", label: "Markup" },
];

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wide text-ledger-muted">{label}</div>
      <div className="mt-1 font-mono text-sm text-ledger-text">{value}</div>
    </div>
  );
}

export function TradeReviewView({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const { state, loading, editTrade, removeTrade, changeTradeScreenshot } = useLedgerData();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Partial<Record<keyof TradeScreenshots, string>>>({});
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const supabaseRef = useRef(createClient());

  const trade = state.trades.find((t) => t.id === tradeId) ?? null;
  const riskUnit = computeRiskUnit(state.trades);

  const [draft, setDraft] = useState<TradeEditableFields | null>(null);

  useEffect(() => {
    if (trade && !draft) {
      setDraft({
        symbol: trade.symbol,
        direction: trade.direction,
        entry: trade.entry,
        exit: trade.exit,
        stop: trade.stop,
        target: trade.target,
        size: trade.size,
        pnl: trade.pnl,
        account: trade.account,
        setup: trade.setup || "",
        durationMinutes: trade.durationMinutes,
        executionScore: trade.executionScore,
        emotionBefore: trade.emotionBefore,
        emotionAfter: trade.emotionAfter,
        mistake: trade.mistake,
        tags: trade.tags || [],
        notes: trade.notes || "",
        reflection: trade.reflection || "",
        followedPlan: trade.followedPlan !== false,
      });
    }
  }, [trade, draft]);

  useEffect(() => {
    if (!trade?.screenshots) return;
    (Object.keys(trade.screenshots) as (keyof TradeScreenshots)[]).forEach((kind) => {
      const path = trade.screenshots?.[kind];
      if (!path) return;
      getSignedScreenshotUrl(supabaseRef.current, path).then((url) => {
        if (url) setSignedUrls((s) => ({ ...s, [kind]: url }));
      });
    });
  }, [trade?.screenshots]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-[320px] w-full rounded-lg" />
        <Skeleton className="h-[240px] w-full rounded-lg" />
      </div>
    );
  }

  if (!trade || !draft) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm italic text-ledger-muted">Trade not found.</p>
        <Link href="/home" className="mt-3 inline-block text-sm text-brass hover:text-brass-soft">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isWin = trade.pnl >= 0;
  const rText = fmtR(trade.pnl, riskUnit);
  const followedPlan = trade.followedPlan !== false;
  const disciplineScore = followedPlan ? 100 : 0;

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await editTrade(trade!.id, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await removeTrade(trade!.id);
      router.push("/history");
    } catch {
      setSaving(false);
      setConfirmingDelete(false);
    }
  }

  async function handleScreenshotChange(kind: keyof TradeScreenshots, file: File | undefined) {
    if (!file || !trade) return;
    setSignedUrls((s) => ({ ...s, [kind]: URL.createObjectURL(file) }));
    await changeTradeScreenshot(trade.id, kind, file);
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-ledger-muted transition-colors hover:text-ledger-text"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-2">
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </>
          )}
          {confirmingDelete ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={saving} className="text-clay hover:bg-clay/10">
                {saving ? "Deleting..." : "Confirm delete"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)} className="text-clay hover:bg-clay/10">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
        </div>
      </motion.div>

      {/* Hero */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", trade.direction === "long" ? "bg-teal/[.15] text-teal" : "bg-clay/[.15] text-clay")}>
              {trade.direction === "long" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            </span>
            <div>
              <h1 className="font-serif text-3xl font-medium">{trade.symbol}</h1>
              <p className="text-sm text-ledger-muted">
                {new Date(trade.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                {trade.account && <> · {trade.account}</>}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("font-mono text-4xl font-bold", isWin ? "text-teal" : "text-clay")}>{fmtMoney(trade.pnl)}</div>
          {rText && <div className="mt-1 text-sm text-ledger-faint">{rText}</div>}
        </div>
      </motion.div>

      {/* Screenshots */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle>Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SLOTS.map((slot) => {
                const path = trade.screenshots?.[slot.key];
                const url = signedUrls[slot.key];
                return (
                  <div key={slot.key}>
                    <input
                      ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleScreenshotChange(slot.key, e.target.files?.[0])}
                    />
                    {path ? (
                      url ? (
                        <button onClick={() => setLightboxSrc(url)} className="block w-full overflow-hidden rounded-lg border border-hairline">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={slot.label} className="aspect-video w-full object-cover transition-opacity hover:opacity-80" />
                        </button>
                      ) : (
                        <div className="aspect-video animate-pulse rounded-lg bg-panel-raised" />
                      )
                    ) : (
                      <button
                        onClick={() => fileInputRefs.current[slot.key]?.click()}
                        className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-hairline text-ledger-muted transition-colors hover:border-brass hover:text-brass"
                      >
                        <ImagePlus className="h-5 w-5" />
                        <span className="text-xs">{slot.label}</span>
                      </button>
                    )}
                    <p className="mt-1.5 text-center text-[10.5px] uppercase tracking-wide text-ledger-faint">{slot.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Scores */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-[18px]">
        <Card className="flex flex-col items-center py-6">
          <DisciplineRing score={disciplineScore} size={72} strokeWidth={6} />
          <p className="mt-3 text-sm font-medium text-ledger-text">Discipline</p>
          <p className="text-xs text-ledger-muted">{followedPlan ? "Followed plan" : "Broke plan"}</p>
        </Card>
        <Card className="flex flex-col items-center py-6">
          <DisciplineRing score={trade.executionScore ? trade.executionScore * 10 : null} size={72} strokeWidth={6} />
          <p className="mt-3 text-sm font-medium text-ledger-text">Execution</p>
          <p className="text-xs text-ledger-muted">{trade.executionScore ? `${trade.executionScore}/10` : "Not rated"}</p>
        </Card>
      </motion.div>

      {editing ? (
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle>Edit trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} placeholder="Instrument" />
                <Input value={draft.account ?? ""} onChange={(e) => setDraft({ ...draft, account: e.target.value })} placeholder="Account" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["long", "short"] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setDraft({ ...draft, direction: dir })}
                    className={cn(
                      "rounded-md border py-2 text-sm font-semibold capitalize transition-colors",
                      draft.direction === dir
                        ? dir === "long" ? "border-teal bg-teal/[.13] text-teal" : "border-clay bg-clay/[.13] text-clay"
                        : "border-hairline bg-panel-raised text-ledger-muted"
                    )}
                  >
                    {dir}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                <Input type="number" inputMode="decimal" step="any" value={draft.entry ?? ""} onChange={(e) => setDraft({ ...draft, entry: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="Entry" />
                <Input type="number" inputMode="decimal" step="any" value={draft.exit ?? ""} onChange={(e) => setDraft({ ...draft, exit: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="Exit" />
                <Input type="number" inputMode="decimal" step="any" value={draft.stop ?? ""} onChange={(e) => setDraft({ ...draft, stop: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="Stop" />
                <Input type="number" inputMode="decimal" step="any" value={draft.target ?? ""} onChange={(e) => setDraft({ ...draft, target: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="Target" />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <Input type="number" inputMode="decimal" step="any" value={draft.size ?? ""} onChange={(e) => setDraft({ ...draft, size: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="Contracts" />
                <Input type="number" inputMode="numeric" value={draft.durationMinutes ?? ""} onChange={(e) => setDraft({ ...draft, durationMinutes: e.target.value ? parseInt(e.target.value, 10) : undefined })} placeholder="Duration (min)" />
                <Input type="number" inputMode="decimal" step="any" value={draft.pnl} onChange={(e) => setDraft({ ...draft, pnl: parseFloat(e.target.value) || 0 })} placeholder="P&L" />
              </div>
              <select
                className="flex h-10 w-full rounded-md border border-hairline bg-panel-raised px-3 text-sm text-ledger-text outline-none focus:border-brass"
                value={draft.setup}
                onChange={(e) => setDraft({ ...draft, setup: e.target.value })}
              >
                <option value="">No setup</option>
                {SETUPS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <LabeledSlider label="Execution quality" value={draft.executionScore ?? 5} onChange={(v) => setDraft({ ...draft, executionScore: v })} lowHint="Sloppy" highHint="Textbook" />

              <div>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-ledger-muted">Emotion before</p>
                <EmotionPicker value={draft.emotionBefore ?? ""} onChange={(v) => setDraft({ ...draft, emotionBefore: v })} />
              </div>
              <div>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-ledger-muted">Emotion after</p>
                <EmotionPicker value={draft.emotionAfter ?? ""} onChange={(v) => setDraft({ ...draft, emotionAfter: v })} />
              </div>

              <Input value={draft.mistake ?? ""} onChange={(e) => setDraft({ ...draft, mistake: e.target.value })} placeholder="Mistake (if any)" />
              <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Notes" />
              <Textarea value={draft.reflection} onChange={(e) => setDraft({ ...draft, reflection: e.target.value })} placeholder="Lesson learned" />
              <Input
                value={draft.tags.join(", ")}
                onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                placeholder="Tags, comma, separated"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, followedPlan: true })}
                  className={cn("flex items-center justify-center gap-1.5 rounded-md border py-2.5 text-sm font-semibold transition-colors", draft.followedPlan ? "border-teal bg-teal/[.13] text-teal" : "border-hairline bg-panel-raised text-ledger-muted")}
                >
                  <Check className="h-4 w-4" /> Followed plan
                </button>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, followedPlan: false })}
                  className={cn("flex items-center justify-center gap-1.5 rounded-md border py-2.5 text-sm font-semibold transition-colors", !draft.followedPlan ? "border-clay bg-clay/[.13] text-clay" : "border-hairline bg-panel-raised text-ledger-muted")}
                >
                  <X className="h-4 w-4" /> Broke plan
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle>Trade information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
                <InfoField label="Entry" value={trade.entry} />
                <InfoField label="Exit" value={trade.exit} />
                <InfoField label="Stop" value={trade.stop} />
                <InfoField label="Target" value={trade.target} />
                <InfoField label="Contracts" value={trade.size} />
                <InfoField label="Duration" value={trade.durationMinutes ? `${trade.durationMinutes} min` : undefined} />
                <InfoField label="Setup" value={trade.setup} />
                <InfoField label="Account" value={trade.account} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle>Psychology</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
                <InfoField label="Confidence" value={trade.confidence ? `${trade.confidence}/10` : undefined} />
                <InfoField label="Emotion before" value={trade.emotionBefore} />
                <InfoField label="Emotion after" value={trade.emotionAfter} />
                <InfoField label="Mistake" value={trade.mistake} />
              </CardContent>
            </Card>
          </motion.div>

          {(trade.notes || trade.reflection || trade.tags.length > 0) && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader>
                  <CardTitle>Reflection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoField label="Notes" value={trade.notes} />
                  <InfoField label="Lesson learned" value={trade.reflection} />
                  {trade.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {trade.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-hairline bg-panel-raised px-2.5 py-1 text-xs text-ledger-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <Card className="border-dashed">
              <CardHeader>
                <Sparkles className="h-[17px] w-[17px] text-brass" />
                <CardTitle>AI Coach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic text-ledger-muted">
                  Coming soon — per-trade AI feedback will appear here once the Coach feature is built out further.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      <ImageLightbox src={lightboxSrc} alt={`${trade.symbol} screenshot`} onClose={() => setLightboxSrc(null)} />
    </motion.div>
  );
}
