import { z } from "zod";

export const verifyEmailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email"),

  verificationCode: z
    .string()
    .regex(
      /^\d{6}$/,
      "Verification code must be 6 digits",
    ),
});

export type VerifyEmailFormData =
  z.infer<typeof verifyEmailSchema>;