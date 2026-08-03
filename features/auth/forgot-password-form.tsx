"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation";
import { requestPasswordReset } from "@/lib/supabase/auth";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setSubmitting(true);
    setServerError(null);
    const { error } = await requestPasswordReset(values.email);
    setSubmitting(false);
    if (error) {
      setServerError(error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ledger-muted">
            If an account exists for that email, a reset link is on its way.
          </p>
          <Link href="/login" className="mt-4 block text-center text-sm text-brass hover:text-brass-soft">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" className="mt-2" {...register("email")} />
            {errors.email && <p className="mt-1.5 text-xs text-clay">{errors.email.message}</p>}
          </div>

          {serverError && <p className="text-sm text-clay">{serverError}</p>}

          <Button type="submit" disabled={submitting} className="w-full py-5">
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <Link href="/login" className="mt-5 block text-center text-sm text-ledger-muted hover:text-brass">
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
