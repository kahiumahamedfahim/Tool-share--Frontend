import { z } from "zod";

export const registrationSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name cannot exceed 50 characters"),

    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name cannot exceed 50 characters"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email"),

   phone: z
  .string()
  .regex(
    /^01[3-9]\d{8}$/,
    "Invalid Bangladeshi phone number",
  ),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(30, "Password cannot exceed 30 characters"),

    confirmPassword: z
      .string()
      .min(1, "Confirm password is required"),

    nidNumber: z
      .string()
      .regex(/^\d{10}$/, "NID number must be exactly 10 digits"),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

export type RegistrationFormData =
  z.infer<typeof registrationSchema>;