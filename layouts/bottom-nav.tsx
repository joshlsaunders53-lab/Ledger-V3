"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const items = [...NAV_ITEMS, { href: "/settings", label: "Settings", icon: Settings, live: true }];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(env(safe-area-inset-bottom)+14px)] md:hidden">
      <div className="ledger-glass flex items-center gap-0.5 rounded-full border border-hairline px-1.5 py-1.5 shadow-2xl">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                active ? "bg-brass/[.16] text-brass" : "text-ledger-faint"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.1 : 1.8} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
