"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[76px] flex-col items-center py-6 md:flex">
      <Link href="/home" className="mb-8 font-serif text-2xl italic text-brass">
        L.
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200",
                active
                  ? "bg-brass/[.14] text-brass"
                  : "text-ledger-faint hover:bg-panel-raised hover:text-ledger-text"
              )}
            >
              <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.1 : 1.8} />
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-hairline bg-ink px-2.5 py-1.5 text-xs font-medium text-ledger-text opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        title="Settings"
        className={cn(
          "group relative mb-3 flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          pathname?.startsWith("/settings")
            ? "bg-panel-raised text-ledger-text"
            : "text-ledger-faint hover:bg-panel-raised hover:text-ledger-text"
        )}
      >
        <Settings className="h-4 w-4" />
      </Link>
      <div className="text-[9px] uppercase tracking-widest text-ledger-faint/60">⌘K</div>
    </aside>
  );
}
