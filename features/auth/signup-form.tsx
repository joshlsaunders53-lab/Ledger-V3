"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signupSchema, type SignupFormValues } from "@/lib/validation";
import { signUpWithPassword } from "@/lib/supabase/auth";

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SignupFormValues) {
    setSubmitting(true);
    setServerError(null);
    const { error } = await signUpWithPassword(values.email, values.password);
    setSubmitting(false);
    if (error) {
      setServerError(error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ledger-muted">
            We sent a confirmation link. Click it to activate your account, then come back and
            sign in.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" className="mt-2" {...register("email")} />
            {errors.email && <p className="mt-1.5 text-xs text-clay">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-2"
              {...register("password")}
            />
            {errors.password && <p className="mt-1.5 text-xs text-clay">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="mt-2"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-clay">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && <p className="text-sm text-clay">{serverError}</p>}

          <Button type="submit" disabled={submitting} className="w-full py-5">
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ledger-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brass hover:text-brass-soft">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
