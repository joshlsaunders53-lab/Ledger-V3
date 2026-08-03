"use client";

import { useState } from "react";
import { renderMarkdownLite, wordCount } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export function JournalFreeWriting({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [preview, setPreview] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              !preview ? "bg-panel-raised text-ledger-text" : "text-ledger-faint hover:text-ledger-muted"
            )}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              preview ? "bg-panel-raised text-ledger-text" : "text-ledger-faint hover:text-ledger-muted"
            )}
          >
            Preview
          </button>
        </div>
        <span className="text-[11px] text-ledger-faint">{wordCount(value)} words</span>
      </div>

      {preview ? (
        <div
          className="journal-markdown min-h-[180px] rounded-md border border-hairline bg-panel-raised px-4 py-3 text-[15px] leading-relaxed text-ledger-text"
          dangerouslySetInnerHTML={{ __html: value.trim() ? renderMarkdownLite(value) : '<p class="italic text-ledger-faint">Nothing written yet.</p>' }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={7}
          className="w-full resize-y rounded-md border border-hairline bg-panel-raised px-4 py-3 text-[15px] leading-relaxed text-ledger-text outline-none placeholder:text-ledger-faint focus:border-brass"
        />
      )}
      <p className="mt-1.5 text-[11px] text-ledger-faint">Supports **bold**, *italic*, # headers, and - lists.</p>
    </div>
  );
}
