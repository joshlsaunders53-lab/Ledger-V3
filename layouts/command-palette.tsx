"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

const EXTRA_DESTINATIONS = [{ href: "/settings", label: "Settings" }];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  const items = useMemo(
    () => [
      ...NAV_ITEMS.map((n) => ({ href: n.href, label: n.label })),
      ...EXTRA_DESTINATIONS,
    ],
    []
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function go(href: string) {
    router.push(href);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[14vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ledger-glass w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-xl border border-hairline shadow-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-ledger-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to..."
            className="w-full bg-transparent text-sm text-ledger-text outline-none placeholder:text-ledger-faint"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && filtered[activeIndex]) {
                go(filtered[activeIndex].href);
              }
            }}
          />
          <kbd className="rounded border border-hairline px-1.5 py-0.5 text-[10px] text-ledger-faint">
            esc
          </kbd>
        </div>

        <div className="max-h-[280px] overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-ledger-muted">No matches.</p>
          )}
          {filtered.map((item, i) => (
            <button
              key={item.href}
              onClick={() => go(item.href)}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                i === activeIndex ? "bg-brass/[.13] text-brass" : "text-ledger-text"
              )}
            >
              {item.label}
              {i === activeIndex && <CornerDownLeft className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
