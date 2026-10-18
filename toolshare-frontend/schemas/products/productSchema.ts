
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
    });

export type CreateProductFormInput = z.input<
    typeof createProductSchema
>;

export type CreateProductFormData = z.output<
    typeof createProductSchema
>;
