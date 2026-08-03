"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ArrowUpRight, ArrowDownRight, Check, X, Pencil, Trash2, ImagePlus, ExternalLink } from "lucide-react";
import { fmtMoney, fmtR } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/client";
import { getSignedScreenshotUrl } from "@/lib/db/storage";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { Trade, TradeScreenshots } from "@/lib/types";
import type { TradeEditableFields } from "@/lib/db/trades";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SLOTS: { key: keyof TradeScreenshots; label: string }[] = [
  { key: "before", label: "Before" },
  { key: "after", label: "After" },
  { key: "markup", label: "Markup" },
];

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wide text-ledger-muted">{label}</div>
      <div className="mt-0.5 text-sm text-ledger-text">{value}</div>
    </div>
  );
}

export function ExpandableTradeRow({
  trade,
  riskUnit,
  onEdit,
  onDelete,
  onChangeScreenshot,
  defaultOpen = false,
}: {
  trade: Trade;
  riskUnit: number;
  onEdit: (tradeId: string, patch: TradeEditableFields) => Promise<void>;
  onDelete: (tradeId: string) => Promise<void>;
  onChangeScreenshot: (tradeId: string, kind: keyof TradeScreenshots, file: File | null) => Promise<void>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<TradeEditableFields>({
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
  const [signedUrls, setSignedUrls] = useState<Partial<Record<keyof TradeScreenshots, string>>>({});
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const supabaseRef = useRef(createClient());

  const isWin = trade.pnl >= 0;
  const followedPlan = trade.followedPlan !== false;
  const rText = fmtR(trade.pnl, riskUnit);

  useEffect(() => {
    if (!open) return;
    const paths = trade.screenshots;
    if (!paths) return;
    (Object.keys(paths) as (keyof TradeScreenshots)[]).forEach((kind) => {
      const path = paths[kind];
      if (!path) return;
      getSignedScreenshotUrl(supabaseRef.current, path).then((url) => {
        if (url) setSignedUrls((s) => ({ ...s, [kind]: url }));
      });
    });
  }, [open, trade.screenshots]);

  async function handleSave() {
    setSaving(true);
    try {
      await onEdit(trade.id, draft);
      setEditing(false);
    } catch {
      // error surfaced via the shared syncError banner upstream
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await onDelete(trade.id);
    } catch {
      setSaving(false);
      setConfirmingDelete(false);
    }
  }

  async function handleScreenshotChange(kind: keyof TradeScreenshots, file: File | undefined) {
    if (!file) return;
    setSignedUrls((s) => ({ ...s, [kind]: URL.createObjectURL(file) }));
    await onChangeScreenshot(trade.id, kind, file);
  }

  return (
    <div className="rounded-md border border-hairline-soft">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-panel-hover"
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded",
            trade.direction === "long" ? "bg-teal/[.15] text-teal" : "bg-clay/[.15] text-clay"
          )}
        >
          {trade.direction === "long" ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
        </span>
        <span className="font-mono text-sm font-bold">{trade.symbol}</span>
        <span className="flex-1 truncate text-xs text-ledger-faint">{trade.setup || "—"}</span>
        {rText && <span className="font-mono text-xs text-ledger-muted">{rText}</span>}
        <span className={cn("font-mono text-sm font-bold", isWin ? "text-teal" : "text-clay")}>
          {fmtMoney(trade.pnl)}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-ledger-faint transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-hairline-soft p-4">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(["long", "short"] as const).map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, direction: dir }))}
                        className={cn(
                          "rounded-md border py-2 text-sm font-semibold capitalize transition-colors",
                          draft.direction === dir
                            ? dir === "long"
                              ? "border-teal bg-teal/[.13] text-teal"
                              : "border-clay bg-clay/[.13] text-clay"
                            : "border-hairline bg-panel-raised text-ledger-muted"
                        )}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={draft.symbol}
                      onChange={(e) => setDraft((d) => ({ ...d, symbol: e.target.value }))}
                      placeholder="Instrument"
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={draft.pnl}
                      onChange={(e) => setDraft((d) => ({ ...d, pnl: parseFloat(e.target.value) || 0 }))}
                      placeholder="P&L"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={draft.entry ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, entry: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      placeholder="Entry"
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={draft.exit ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, exit: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      placeholder="Exit"
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={draft.size ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      placeholder="Contracts"
                    />
                  </div>
                  <Textarea
                    value={draft.notes}
                    onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                    placeholder="Notes"
                  />
                  <Textarea
                    value={draft.reflection}
                    onChange={(e) => setDraft((d) => ({ ...d, reflection: e.target.value }))}
                    placeholder="Reflection"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, followedPlan: true }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-semibold transition-colors",
                        draft.followedPlan
                          ? "border-teal bg-teal/[.13] text-teal"
                          : "border-hairline bg-panel-raised text-ledger-muted"
                      )}
                    >
                      <Check className="h-3.5 w-3.5" /> Followed plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, followedPlan: false }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-semibold transition-colors",
                        !draft.followedPlan
                          ? "border-clay bg-clay/[.13] text-clay"
                          : "border-hairline bg-panel-raised text-ledger-muted"
                      )}
                    >
                      <X className="h-3.5 w-3.5" /> Broke plan
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                    <DetailField label="Instrument" value={trade.symbol} />
                    <DetailField label="Direction" value={<span className="capitalize">{trade.direction}</span>} />
                    {trade.entry !== undefined && <DetailField label="Entry" value={trade.entry} />}
                    {trade.exit !== undefined && <DetailField label="Exit" value={trade.exit} />}
                    {trade.stop !== undefined && <DetailField label="Stop" value={trade.stop} />}
                    {trade.target !== undefined && <DetailField label="Target" value={trade.target} />}
                    {trade.size !== undefined && <DetailField label="Contracts" value={trade.size} />}
                    {rText && <DetailField label="R Multiple" value={rText} />}
                    {trade.durationMinutes !== undefined && (
                      <DetailField label="Duration" value={`${trade.durationMinutes} min`} />
                    )}
                    {trade.account && <DetailField label="Account" value={trade.account} />}
                    {trade.setup && <DetailField label="Setup" value={trade.setup} />}
                    {trade.executionScore !== undefined && (
                      <DetailField label="Execution" value={`${trade.executionScore}/10`} />
                    )}
                    {trade.confidence !== undefined && (
                      <DetailField label="Confidence" value={`${trade.confidence}/10`} />
                    )}
                    {trade.emotionBefore && <DetailField label="Emotion before" value={trade.emotionBefore} />}
                    {trade.emotionAfter && <DetailField label="Emotion after" value={trade.emotionAfter} />}
                    <DetailField
                      label="Discipline"
                      value={
                        <span className={cn("inline-flex items-center gap-1", followedPlan ? "text-teal" : "text-clay")}>
                          {followedPlan ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          {followedPlan ? "Followed plan" : "Broke plan"}
                        </span>
                      }
                    />
                    {trade.mistake && <DetailField label="Mistake" value={trade.mistake} />}
                  </div>

                  {trade.notes && (
                    <div className="mt-3">
                      <DetailField label="Notes" value={trade.notes} />
                    </div>
                  )}
                  {trade.reflection && (
                    <div className="mt-3">
                      <DetailField label="Lesson learned" value={trade.reflection} />
                    </div>
                  )}
                  {trade.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {trade.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-hairline bg-panel-raised px-2 py-0.5 text-[11px] text-ledger-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="mb-1.5 text-[10.5px] uppercase tracking-wide text-ledger-muted">
                      Screenshots
                    </div>
                    <div className="grid grid-cols-3 gap-2">
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
                                <button
                                  type="button"
                                  onClick={() => setLightboxSrc(url)}
                                  className="block w-full overflow-hidden rounded-md border border-hairline"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt={slot.label} className="h-20 w-full object-cover transition-opacity hover:opacity-80" />
                                </button>
                              ) : (
                                <div className="h-20 animate-pulse rounded-md bg-panel-raised" />
                              )
                            ) : (
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[slot.key]?.click()}
                                className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-hairline text-[11px] text-ledger-muted transition-colors hover:border-ledger-muted"
                              >
                                <ImagePlus className="h-3.5 w-3.5" />
                                {slot.label}
                              </button>
                            )}
                            {!path && <p className="mt-1 text-center text-[10px] text-ledger-faint">{slot.label}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline-soft pt-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/trades/${trade.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" /> Full review
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    {confirmingDelete ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDelete}
                          disabled={saving}
                          className="text-clay hover:bg-clay/10"
                        >
                          {saving ? "Deleting..." : "Confirm delete"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageLightbox src={lightboxSrc} alt={`${trade.symbol} screenshot`} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
