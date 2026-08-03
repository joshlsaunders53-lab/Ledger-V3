"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserCircle, Wallet, Palette, Database, LogOut, ListChecks } from "lucide-react";
import { RulesManager } from "./rules-manager";
import { useLedgerData } from "@/hooks/use-ledger-data";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/supabase/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, fadeUp } from "@/lib/motion";

export function SettingsView() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, loading, updateStartingBalance, updateRules } = useLedgerData();
  const [draft, setDraft] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-[140px] w-full rounded-lg" />
        <Skeleton className="h-[140px] w-full rounded-lg" />
      </div>
    );
  }

  const balanceValue = draft ?? String(state.startingBalance);

  function saveBalance() {
    const num = parseFloat((draft ?? "").replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(num)) updateStartingBalance(num);
    setDraft(null);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp}>
        <h1 className="font-serif text-2xl font-medium">Settings</h1>
        <p className="mt-1 text-sm text-ledger-muted">Account, data, and preferences.</p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <UserCircle className="h-[17px] w-[17px] text-brass" />
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-ledger-muted">
              Signed in as <span className="text-ledger-text">{user?.email}</span>. Your data is
              private to this account and synced across every device you sign into.
            </p>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-clay hover:bg-clay/10"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "Signing out..." : "Sign out"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <Wallet className="h-[17px] w-[17px] text-brass" />
            <CardTitle>Starting balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-ledger-muted">
              Used to calculate your account balance (starting balance + total P&L).
            </p>
            <div className="flex max-w-xs gap-2">
              <Input
                value={balanceValue}
                onChange={(e) => setDraft(e.target.value)}
                inputMode="decimal"
              />
              <Button onClick={saveBalance}>Save</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <ListChecks className="h-[17px] w-[17px] text-brass" />
            <CardTitle>Trading rules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-ledger-muted">
              What you actually get checked against — referenced by &ldquo;did you follow your
              plan?&rdquo; on every trade and in your Evening Journal.
            </p>
            <RulesManager rules={state.rules} onChange={updateRules} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <Palette className="h-[17px] w-[17px] text-brass" />
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ledger-muted">
              Dark mode only, by design — matches the original Ledger brief.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <Database className="h-[17px] w-[17px] text-brass" />
            <CardTitle>Your data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-mono text-xl font-bold text-ledger-text">{state.trades.length}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-ledger-muted">Trades</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-ledger-text">{state.sessions.length}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-ledger-muted">Sessions</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-ledger-text">{state.rules.length}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-ledger-muted">Rules</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
