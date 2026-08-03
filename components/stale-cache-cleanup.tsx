"use client";

import { useEffect } from "react";

/**
 * The very first version of Ledger was a static site with its own
 * service worker (sw.js) that aggressively cached pages. Service
 * workers persist per-browser, per-domain, indefinitely — they don't
 * go away just because new code gets deployed. If this domain ever
 * served that old service worker, a browser could still be serving
 * stale cached content today, no matter what's actually deployed.
 * This removes any leftover registration and cache, once, silently.
 */
export function StaleCacheCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }

    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
  }, []);

  return null;
}
