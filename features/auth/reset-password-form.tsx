"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validation";
import { updatePassword } from "@/lib/supabase/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setSubmitting(true);
    setServerError(null);
    const { error } = await updatePassword(values.password);
    setSubmitting(false);
    if (error) {
      setServerError(error);
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
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
            <Label htmlFor="confirmPassword">Confirm new password</Label>
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
            {submitting ? "Saving..." : "Save new password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
