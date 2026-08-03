"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginFormValues } from "@/lib/validation";
import { signInWithPassword } from "@/lib/supabase/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    setServerError(null);
    const { error } = await signInWithPassword(values.email, values.password);
    setSubmitting(false);
    if (error) {
      setServerError(error);
      return;
    }
    router.push(searchParams.get("next") || "/home");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" className="mt-2" {...register("email")} />
            {errors.email && <p className="mt-1.5 text-xs text-clay">{errors.email.message}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-ledger-muted hover:text-brass">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-2"
              {...register("password")}
            />
            {errors.password && <p className="mt-1.5 text-xs text-clay">{errors.password.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-ledger-muted">
            <input type="checkbox" className="accent-brass" {...register("rememberMe")} />
            Remember me
          </label>

          {serverError && <p className="text-sm text-clay">{serverError}</p>}

          <Button type="submit" disabled={submitting} className="w-full py-5">
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ledger-muted">
          New to Ledger?{" "}
          <Link href="/signup" className="text-brass hover:text-brass-soft">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
