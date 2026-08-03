import { z } from "zod";

export const preTradeSchema = z.object({
  sleep: z.number().min(1).max(10),
  stress: z.number().min(1).max(10),
  confidence: z.number().min(1).max(10),
  energy: z.number().min(1).max(10),
  objective: z.string().trim().min(1, "Set today's objective"),
});

export type PreTradeFormValues = z.infer<typeof preTradeSchema>;

export const addTradeSchema = z.object({
  symbol: z.string().trim().min(1, "Required"),
  direction: z.enum(["long", "short"]),
  entry: z.coerce.number().optional(),
  exit: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  pnl: z.coerce.number(),
  setup: z.string().optional(),
  notes: z.string().optional(),
  reflection: z.string().optional(),
  followedPlan: z.boolean(),
});

export type AddTradeFormValues = z.infer<typeof addTradeSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean(),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
