
import { z } from "zod";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_IMAGES = 10;
const MAX_DOCUMENTS = 5;
const MAX_RENTAL_DAYS = 30;
const MAX_BUFFER_DAYS = 30;

const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

// Convert form input into a number and reject empty values.
const integerField = (label: string, min: number, max: number) =>
    z.preprocess(
        (value) => {
            if (value === "" || value === null || value === undefined) {
                return undefined;
            }

            if (typeof value === "string") {
                return Number(value);
            }

            return value;
        },
        z
            .number({
                error: `${label} must be a valid number.`,
            })
            .finite(`${label} must be a finite number.`)
            .int(`${label} must be a whole number.`)
            .min(min, `${label} must be at least ${min}.`)
            .max(max, `${label} cannot exceed ${max}.`),
    );

export const createProductSchema = z
    .object({
        // Basic product information

        name: z
            .string()
            .trim()
            .min(1, "Product name is required.")
            .max(150, "Product name cannot exceed 150 characters."),

        description: z
            .string()
            .trim()
            .min(1, "Description is required."),

        categoryId: z
            .string()
            .trim()
            .min(1, "Please select a category.")
            .max(20, "Category ID cannot exceed 20 characters."),

        pricePerDay: z
            .string()
            .trim()
            .min(1, "Rental price is required.")
            .refine(
                (value) =>
                    /^\d+(\.\d{1,2})?$/.test(value) &&
                    Number.isFinite(Number(value)) &&
                    Number(value) > 0,
                "Price must be greater than 0 and have at most 2 decimal places.",
            ),

        negotiationAllowed: z.boolean(),

        // Rental policy

        minRentalDays: integerField(
            "Minimum rental days",
            1,
            MAX_RENTAL_DAYS,
        ),

        maxRentalDays: integerField(
            "Maximum rental days",
            1,
            MAX_RENTAL_DAYS,
        ),

        preparationBufferDays: integerField(
            "Preparation buffer",
            0,
            MAX_BUFFER_DAYS,
        ),

        allowSameDayRental: z.boolean(),

        // Owner-chosen date windows (optional ISO strings)
        rentalWindowStart: z.preprocess(
            (value) =>
                value === undefined || value === null || value === ""
                    ? undefined
                    : String(value),
            z.string().datetime({ offset: true }).optional().nullable(),
        ),
        rentalWindowEnd: z.preprocess(
            (value) =>
                value === undefined || value === null || value === ""
                    ? undefined
                    : String(value),
            z.string().datetime({ offset: true }).optional().nullable(),
        ),
        deliveryWindowStart: z.preprocess(
            (value) =>
                value === undefined || value === null || value === ""
                    ? undefined
                    : String(value),
            z.string().datetime({ offset: true }).optional().nullable(),
        ),
        deliveryWindowEnd: z.preprocess(
            (value) =>
                value === undefined || value === null || value === ""
                    ? undefined
                    : String(value),
            z.string().datetime({ offset: true }).optional().nullable(),
        ),
        returnWindowStart: z.preprocess(
            (value) =>
                value === undefined || value === null || value === ""
                    ? undefined
                    : String(value),
            z.string().datetime({ offset: true }).optional().nullable(),
        ),
        returnWindowEnd: z.preprocess(
            (value) =>
                value === undefined || value === null || value === ""
                    ? undefined
                    : String(value),
            z.string().datetime({ offset: true }).optional().nullable(),
        ),

        // Platform fee percentage per day (default 10)
        platformFeePercentage: z.preprocess(
            (value) =>
                value === undefined || value === null || value === ""
                    ? undefined
                    : String(value),
            z.string()
                .optional()
                .refine(
                    (value) =>
                        value === undefined ||
                        (/^\d+(\.\d{1,2})?$/.test(value) &&
                            Number.isFinite(Number(value)) &&
                            Number(value) >= 0 &&
                            Number(value) <= 100),
                    "Platform fee must be between 0 and 100.",
                ),
        ),

        // Base delivery fee
        deliveryFeeBase: z.preprocess(
            (value) =>
                value === undefined || value === null || value === ""
                    ? undefined
                    : String(value),
            z.string()
                .optional()
                .refine(
                    (value) =>
                        value === undefined ||
                        (/^\d+(\.\d{1,2})?$/.test(value) &&
                            Number.isFinite(Number(value)) &&
                            Number(value) >= 0),
                    "Delivery fee must be a positive number.",
                ),
        ),

        // Product images

        images: z
            .array(
                z.custom<File>(
                    (file) =>
                        typeof File !== "undefined" &&
                        file instanceof File,
                    "Please select a valid image.",
                ),
            )
            .min(1, "Please upload at least one product image.")
            .max(MAX_IMAGES, "You can upload a maximum of 10 images.")
            .refine(
                (files) =>
                    files.every((file) => file.size <= MAX_IMAGE_SIZE),
                "Each image must be 2 MB or smaller.",
            )
            .refine(
                (files) =>
                    files.every((file) =>
                        allowedImageTypes.includes(file.type),
                    ),
                "Images must be JPG, PNG or WEBP files.",
            ),

        // Optional PDF documents

        documents: z
            .array(
                z.custom<File>(
                    (file) =>
                        typeof File !== "undefined" &&
                        file instanceof File,
                    "Please select a valid document.",
                ),
            )
            .max(
                MAX_DOCUMENTS,
                "You can upload a maximum of 5 PDF documents.",
            )
            .refine(
                (files) =>
                    files.every(
                        (file) => file.type === "application/pdf",
                    ),
                "Only PDF documents are allowed.",
            ),
    })
    .superRefine((data, ctx) => {
        if (data.minRentalDays > data.maxRentalDays) {
            ctx.addIssue({
                code: "custom",
                path: ["maxRentalDays"],
                message:
                    "Maximum rental days must be greater than or equal to minimum rental days.",
            });
        }

        // Date window comparison: rental window start must not be before
        // delivery to rider start (delivery must happen before rental starts)
        if (
            data.rentalWindowStart &&
            data.deliveryWindowStart &&
            new Date(data.rentalWindowStart) <
                new Date(data.deliveryWindowStart)
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["rentalWindowStart"],
                message:
                    "Rental window start must be on or after the delivery-to-rider start time.",
            });
        }

        // Return window start must be on or after rental window end
        if (
            data.rentalWindowEnd &&
            data.returnWindowStart &&
            new Date(data.returnWindowStart) <
                new Date(data.rentalWindowEnd)
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["returnWindowStart"],
                message:
                    "Return window start must be on or after the rental window end.",
            });
        }
    });

export type CreateProductFormInput = z.input<
    typeof createProductSchema
>;

export type CreateProductFormData = z.output<
    typeof createProductSchema
>;
