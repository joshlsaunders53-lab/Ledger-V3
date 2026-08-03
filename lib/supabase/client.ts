import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client for use in Client Components. Safe to call repeatedly —
 * @supabase/ssr handles session storage in cookies/localStorage for you.
 *
 * Auth is scaffolded but not wired up yet: today the app still reads and
 * writes a single shared row (see hooks/use-ledger-data.ts) the same way
 * the original static app did. When auth lands, swap that single-row
 * query for one scoped to auth.uid().
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
