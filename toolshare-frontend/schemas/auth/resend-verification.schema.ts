import { z } from "zod";

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email"),
});

export type ResendVerificationFormData = z.infer<
  typeof resendVerificationSchema
>;
