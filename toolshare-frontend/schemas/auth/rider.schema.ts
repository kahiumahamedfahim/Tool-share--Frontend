import { z } from "zod";
import { registrationSchema } from "@/schemas/auth/registration.schema";

export const riderSchema = registrationSchema.extend({
  drivingLicenseNumber: z
    .string()
    .min(1, "Driving license number is required"),

  vehicleType: z
    .string()
    .min(1, "Vehicle type is required"),

  vehicleNumber: z
    .string()
    .min(1, "Vehicle number is required"),
});

export type RiderFormData = z.infer<typeof riderSchema>;