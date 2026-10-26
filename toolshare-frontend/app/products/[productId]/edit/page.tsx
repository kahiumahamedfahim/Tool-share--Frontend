"use client";

import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { useForm } from "react-hook-form";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000";

function getFileUrl(path?: string): string {
    if (!path) return "";

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return `${API_BASE_URL}/${path
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")}`;
}

import api from "@/app/lib/axios";

import ProductLocationPicker, {
    type ProductLocationData,
} from "@/app/products/ProductLocationPicker";

import ErrorMessage from "@/app/components/ErrorMessage";

// =========================================================
// TYPES
// =========================================================

interface Category {
    categoryId: string;
    name: string;
}

interface ProductMedia {
    id: string;
    productId: string;
    filePath: string;
    createdAt?: string;
}

interface ProductImage extends ProductMedia {
    imageUrl?: string;
    url?: string;
}

interface ProductDocument extends ProductMedia {
    documentUrl?: string;
    url?: string;
}

interface Product {
    id?: string;
    productId: string;

    ownerId?: string;
    categoryId: string;

    name: string;
    description: string;

    pricePerDay: string | number;

    negotiationAllowed: boolean;

    minRentalDays: number;
    maxRentalDays: number;
    preparationBufferDays: number;
    allowSameDayRental: boolean;

    availabilityStatus: string;

    category?: {
        categoryId: string;
        name: string;
    };

    location?: {
        latitude: string | number;
        longitude: string | number;
        division: string;
        district: string;
        upazila: string;
        pickupAddress: string;
    };

    productImages?: ProductImage[];
    productDocuments?: ProductDocument[];
}

// =========================================================
// SCHEMA
// =========================================================

const updateProductSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, "Product name is required"),

        description: z
            .string()
            .trim()
            .min(1, "Product description is required"),

        categoryId: z
            .string()
            .trim()
            .min(1, "Please select a category"),

        pricePerDay: z
            .number()
            .positive("Price must be greater than 0"),

        negotiationAllowed: z.boolean(),

        minRentalDays: z
            .number()
            .int()
            .min(
                1,
                "Minimum rental days must be at least 1",
            ),

        maxRentalDays: z
            .number()
            .int()
            .min(
                1,
                "Maximum rental days must be at least 1",
            ),

        preparationBufferDays: z
            .number()
            .int()
            .min(
                0,
                "Preparation buffer cannot be negative",
            ),

        allowSameDayRental: z.boolean(),

        availabilityStatus: z.string(),
    })
    .refine(
        (data) =>
            data.minRentalDays <= data.maxRentalDays,
        {
            message:
                "Minimum rental days cannot be greater than maximum rental days",
            path: ["maxRentalDays"],
        },
    );

type UpdateProductFormData = z.infer<
    typeof updateProductSchema
>;

// =========================================================
// PAGE
// =========================================================

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();

    const productId = params.productId as string;

    // =====================================================
    // STATE
    // =====================================================

    const [product, setProduct] =
        useState<Product | null>(null);

    const [categories, setCategories] =
        useState<Category[]>([]);

    const [location, setLocation] =
        useState<ProductLocationData>({
            latitude: null,
            longitude: null,
            division: "",
            district: "",
            upazila: "",
            pickupAddress: "",
        });

    const [locationConfirmed, setLocationConfirmed] =
        useState(false);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    // ErrorMessage modal state
    const [error, setError] = useState("");

    const [showError, setShowError] = useState(false);

    const [success, setSuccess] = useState("");

    const [newImages, setNewImages] =
        useState<File[]>([]);

    const [newDocuments, setNewDocuments] =
        useState<File[]>([]);

    const [deleteImageIds, setDeleteImageIds] =
        useState<string[]>([]);

    const [deleteDocumentIds, setDeleteDocumentIds] =
        useState<string[]>([]);

    // =====================================================
    // FORM
    // =====================================================

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<UpdateProductFormData>({
        resolver: zodResolver(
            updateProductSchema,
        ),

        defaultValues: {
            name: "",
            description: "",
            categoryId: "",
            pricePerDay: 0,
            negotiationAllowed: false,
            minRentalDays: 1,
            maxRentalDays: 30,
            preparationBufferDays: 0,
            allowSameDayRental: false,
            availabilityStatus: "AVAILABLE",
        },
    });

    const negotiationAllowed =
        watch("negotiationAllowed");

    const allowSameDayRental =
        watch("allowSameDayRental");

    const availabilityStatus =
        watch("availabilityStatus");

    const minRentalDays =
        watch("minRentalDays");

    const maxRentalDays =
        watch("maxRentalDays");

    // =====================================================
    // SHOW ERROR MODAL
    // =====================================================

    const showErrorMessage = (
        message: string,
    ) => {
        setError(message);
        setShowError(true);
    };

    // =====================================================
    // LOAD PRODUCT + CATEGORIES
    // =====================================================

    useEffect(() => {
        if (!productId) return;

        const loadData = async () => {
            try {
                setLoading(true);

                const [
                    productResponse,
                    categoryResponse,
                ] = await Promise.all([
                    api.get(
                        `/products/${productId}`,
                    ),

                    api.get("/categories", {
                        params: {
                            page: 1,
                            limit: 100,
                        },
                    }),
                ]);

                // -----------------------------------------
                // Product
                // -----------------------------------------

                const productData =
                    productResponse.data?.data ??
                    productResponse.data;

                setProduct(productData);

                setNewImages([]);
                setNewDocuments([]);
                setDeleteImageIds([]);
                setDeleteDocumentIds([]);

                reset({
                    name:
                        productData.name ?? "",

                    description:
                        productData.description ?? "",

                    categoryId:
                        productData.category?.categoryId ??
                        productData.categoryId ??
                        "",

                    pricePerDay:
                        Number(
                            productData.pricePerDay ?? 0,
                        ),

                    negotiationAllowed:
                        Boolean(
                            productData.negotiationAllowed,
                        ),

                    minRentalDays:
                        Number(
                            productData.minRentalDays ?? 1,
                        ),

                    maxRentalDays:
                        Number(
                            productData.maxRentalDays ?? 30,
                        ),

                    preparationBufferDays:
                        Number(
                            productData.preparationBufferDays ?? 0,
                        ),

                    allowSameDayRental:
                        Boolean(
                            productData.allowSameDayRental,
                        ),

                    availabilityStatus:
                        productData.availabilityStatus ??
                        "AVAILABLE",
                });

                // -----------------------------------------
                // Location
                // -----------------------------------------

                if (productData.location) {
                    setLocation({
                        latitude:
                            Number(
                                productData.location.latitude,
                            ),

                        longitude:
                            Number(
                                productData.location.longitude,
                            ),

                        division:
                            productData.location.division ??
                            "",

                        district:
                            productData.location.district ??
                            "",

                        upazila:
                            productData.location.upazila ??
                            "",

                        pickupAddress:
                            productData.location.pickupAddress ??
                            "",
                    });
                }

                // -----------------------------------------
                // Categories
                // -----------------------------------------

                const categoryData =
                    categoryResponse.data?.data ??
                    categoryResponse.data;

                setCategories(
                    Array.isArray(categoryData)
                        ? categoryData
                        : [],
                );
            } catch (err: any) {
                console.error(
                    "Failed to load edit product data:",
                    err,
                );

                const message =
                    err?.response?.data?.message ??
                    "Failed to load product.";

                showErrorMessage(
                    Array.isArray(message)
                        ? message.join(", ")
                        : message,
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [
        productId,
        reset,
    ]);

    // =====================================================
    // RENTAL RANGE MESSAGE
    // =====================================================

    const rentalRangeMessage =
        useMemo(() => {
            if (
                !minRentalDays ||
                !maxRentalDays
            ) {
                return "";
            }

            return `Renters can request ${minRentalDays} to ${maxRentalDays} days.`;
        }, [
            minRentalDays,
            maxRentalDays,
        ]);

    // =====================================================
    // UPDATE PRODUCT
    // =====================================================

    const onSubmit = async (
        data: UpdateProductFormData,
    ) => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            // -----------------------------------------
            // Location validation
            // -----------------------------------------

            if (
                location.latitude === null ||
                location.longitude === null
            ) {
                showErrorMessage(
                    "Please select the product pickup location.",
                );

                setSaving(false);
                return;
            }

            if (
                !location.division.trim() ||
                !location.district.trim() ||
                !location.upazila.trim() ||
                !location.pickupAddress.trim()
            ) {
                showErrorMessage(
                    "Please complete all pickup location fields.",
                );

                setSaving(false);
                return;
            }

            if (!locationConfirmed) {
                showErrorMessage(
                    "Please confirm the pickup location before updating the product.",
                );

                setSaving(false);
                return;
            }

            // -----------------------------------------
            // Multipart payload
            // -----------------------------------------

            const formData = new FormData();

            formData.append(
                "name",
                data.name.trim(),
            );

            formData.append(
                "description",
                data.description.trim(),
            );

            formData.append(
                "categoryId",
                data.categoryId,
            );

            formData.append(
                "pricePerDay",
                String(data.pricePerDay),
            );

            formData.append(
                "negotiationAllowed",
                String(data.negotiationAllowed),
            );

            formData.append(
                "minRentalDays",
                String(data.minRentalDays),
            );

            formData.append(
                "maxRentalDays",
                String(data.maxRentalDays),
            );

            formData.append(
                "preparationBufferDays",
                String(
                    data.preparationBufferDays,
                ),
            );

            formData.append(
                "allowSameDayRental",
                String(data.allowSameDayRental),
            );

            formData.append(
                "availabilityStatus",
                data.availabilityStatus,
            );

            formData.append(
                "latitude",
                String(location.latitude),
            );

            formData.append(
                "longitude",
                String(location.longitude),
            );

            formData.append(
                "division",
                location.division.trim(),
            );

            formData.append(
                "district",
                location.district.trim(),
            );

            formData.append(
                "upazila",
                location.upazila.trim(),
            );

            formData.append(
                "pickupAddress",
                location.pickupAddress.trim(),
            );

            newImages.forEach((file) => {
                formData.append(
                    "productImages",
                    file,
                );
            });

            newDocuments.forEach((file) => {
                formData.append(
                    "productDocuments",
                    file,
                );
            });

            deleteImageIds.forEach(
                (imageId) => {
                    formData.append(
                        "deleteImageIds",
                        imageId,
                    );
                },
            );

            deleteDocumentIds.forEach(
                (documentId) => {
                    formData.append(
                        "deleteDocumentIds",
                        documentId,
                    );
                },
            );

            // -----------------------------------------
            // PATCH
            // -----------------------------------------

            await api.patch(
                `/products/${productId}`,
                formData,
            );

            setSuccess(
                "Product updated successfully.",
            );

            // -----------------------------------------
            // Redirect
            // -----------------------------------------

            setTimeout(() => {
                router.push(
                    `/products/${productId}`,
                );
            }, 800);
        } catch (err: any) {
            console.error(
                "Failed to update product:",
                err,
            );

            const message =
                err?.response?.data?.message ??
                "Failed to update product.";

            showErrorMessage(
                Array.isArray(message)
                    ? message.join(", ")
                    : message,
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50">
                <div className="mx-auto flex min-h-[300px] w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                    <p className="text-sm text-slate-500">
                        Loading product...
                    </p>
                </div>
            </main>
        );
    }

    // =====================================================
    // PRODUCT NOT FOUND
    // =====================================================

    if (!product) {
        return (
            <main className="min-h-screen bg-slate-50">
                <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                    <p className="text-sm text-slate-600">
                        Product not found.
                    </p>
                </div>
            </main>
        );
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <main className="min-h-screen bg-slate-50">
            {/* ERROR MODAL */}

            <ErrorMessage
                message={error}
                show={showError}
                onClose={() =>
                    setShowError(false)
                }
            />

            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                {/* HEADER */}

                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                `/products/${productId}`,
                            )
                        }
                        className="mb-4 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                    >
                        ← Back to product
                    </button>

                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                        Update Product
                    </h1>

                    <p className="mt-2 text-sm text-slate-600">
                        Update your product information,
                        rental settings, and pickup
                        location.
                    </p>
                </div>

                {/* SUCCESS */}

                {success && (
                    <div
                        role="status"
                        className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700"
                    >
                        {success}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit(
                        onSubmit,
                    )}
                    className="space-y-8"
                >
                    {/* BASIC INFORMATION */}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Basic Information
                        </h2>

                        <div className="mt-6 space-y-5">
                            {/* Product Name */}

                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Product name
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    {...register("name")}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />

                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {
                                            errors
                                                .name
                                                .message
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Description */}

                            <div>
                                <label
                                    htmlFor="description"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="description"
                                    rows={5}
                                    {...register(
                                        "description",
                                    )}
                                    className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />

                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {
                                            errors
                                                .description
                                                .message
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Category */}

                            <div>
                                <label
                                    htmlFor="categoryId"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Category
                                </label>

                                <select
                                    id="categoryId"
                                    {...register(
                                        "categoryId",
                                    )}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="">
                                        Select category
                                    </option>

                                    {categories.map(
                                        (
                                            category,
                                        ) => (
                                            <option
                                                key={
                                                    category.categoryId
                                                }
                                                value={
                                                    category.categoryId
                                                }
                                            >
                                                {
                                                    category.name
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>

                                {errors.categoryId && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {
                                            errors
                                                .categoryId
                                                .message
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* PRICING */}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Pricing
                        </h2>

                        <div className="mt-6">
                            <label
                                htmlFor="pricePerDay"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Price per day
                            </label>

                            <input
                                id="pricePerDay"
                                type="number"
                                step="0.01"
                                {...register(
                                    "pricePerDay",
                                    {
                                        valueAsNumber:
                                            true,
                                    },
                                )}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />

                            {errors.pricePerDay && (
                                <p className="mt-1 text-sm text-red-600">
                                    {
                                        errors
                                            .pricePerDay
                                            .message
                                    }
                                </p>
                            )}
                        </div>
                    </section>

                    {/* RENTAL SETTINGS */}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Rental Settings
                        </h2>

                        <div className="mt-6 space-y-6">
                            {/* Negotiation */}

                            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        Allow negotiation
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Renters can make an
                                        offer instead of
                                        accepting only the
                                        listed price.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setValue(
                                            "negotiationAllowed",
                                            !negotiationAllowed,
                                            {
                                                shouldDirty:
                                                    true,
                                            },
                                        )
                                    }
                                    className={`relative h-7 w-12 rounded-full transition ${
                                        negotiationAllowed
                                            ? "bg-blue-600"
                                            : "bg-slate-300"
                                    }`}
                                    aria-pressed={
                                        negotiationAllowed
                                    }
                                >
                                    <span
                                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                                            negotiationAllowed
                                                ? "left-6"
                                                : "left-1"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Rental Days */}

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="minRentalDays"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Minimum rental days
                                    </label>

                                    <input
                                        id="minRentalDays"
                                        type="number"
                                        {...register(
                                            "minRentalDays",
                                            {
                                                valueAsNumber:
                                                    true,
                                            },
                                        )}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />

                                    {errors.minRentalDays && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {
                                                errors
                                                    .minRentalDays
                                                    .message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="maxRentalDays"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Maximum rental days
                                    </label>

                                    <input
                                        id="maxRentalDays"
                                        type="number"
                                        {...register(
                                            "maxRentalDays",
                                            {
                                                valueAsNumber:
                                                    true,
                                            },
                                        )}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />

                                    {errors.maxRentalDays && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {
                                                errors
                                                    .maxRentalDays
                                                    .message
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>

                            {rentalRangeMessage && (
                                <p className="text-sm text-slate-500">
                                    {rentalRangeMessage}
                                </p>
                            )}

                            {/* Preparation Buffer */}

                            <div>
                                <label
                                    htmlFor="preparationBufferDays"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Preparation buffer days
                                </label>

                                <input
                                    id="preparationBufferDays"
                                    type="number"
                                    {...register(
                                        "preparationBufferDays",
                                        {
                                            valueAsNumber:
                                                true,
                                        },
                                    )}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />

                                {errors.preparationBufferDays && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {
                                            errors
                                                .preparationBufferDays
                                                .message
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Same Day */}

                            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        Allow same-day rental
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Allow renters to
                                        request the product
                                        for the same day.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setValue(
                                            "allowSameDayRental",
                                            !allowSameDayRental,
                                            {
                                                shouldDirty:
                                                    true,
                                            },
                                        )
                                    }
                                    className={`relative h-7 w-12 rounded-full transition ${
                                        allowSameDayRental
                                            ? "bg-blue-600"
                                            : "bg-slate-300"
                                    }`}
                                    aria-pressed={
                                        allowSameDayRental
                                    }
                                >
                                    <span
                                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                                            allowSameDayRental
                                                ? "left-6"
                                                : "left-1"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* AVAILABILITY */}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Availability
                        </h2>

                        <div className="mt-6">
                            <label
                                htmlFor="availabilityStatus"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Product availability
                            </label>

                            <select
                                id="availabilityStatus"
                                {...register(
                                    "availabilityStatus",
                                )}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="AVAILABLE">
                                    Available
                                </option>

                                <option value="UNAVAILABLE">
                                    Unavailable
                                </option>
                            </select>

                            <p className="mt-2 text-sm text-slate-500">
                                Current status:{" "}
                                <span className="font-medium">
                                    {availabilityStatus}
                                </span>
                            </p>
                        </div>
                    </section>

                    {/* PHOTOS & DOCUMENTS */}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Photos & Documents
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage your existing product
                            photos and optional PDF
                            documents.
                        </p>

                        {/* EXISTING IMAGES */}

                        <div className="mt-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800">
                                        Product photos
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        At least one product
                                        photo must remain.
                                    </p>
                                </div>

                                <span className="text-xs text-slate-500">
                                    {product.productImages
                                        ?.filter(
                                            (
                                                image,
                                            ) =>
                                                !deleteImageIds.includes(
                                                    image.id,
                                                ),
                                        )
                                        .length ??
                                        0}{" "}
                                    existing +{" "}
                                    {newImages.length}{" "}
                                    new
                                </span>
                            </div>

                            {(product.productImages
                                ?.length ?? 0) > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                    {product.productImages?.map(
                                        (image) => {
                                            const markedForDelete =
                                                deleteImageIds.includes(
                                                    image.id,
                                                );

                                            return (
                                                <div
                                                    key={
                                                        image.id
                                                    }
                                                    className={`relative overflow-hidden rounded-xl border ${
                                                        markedForDelete
                                                            ? "border-red-300 opacity-50"
                                                            : "border-slate-200"
                                                    }`}
                                                >
                                                    <img
                                                        src={getFileUrl(
                                                            image.filePath,
                                                        )}
                                                        alt="Product"
                                                        className="h-32 w-full object-cover"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeleteImageIds(
                                                                (
                                                                    current,
                                                                ) =>
                                                                    current.includes(
                                                                        image.id,
                                                                    )
                                                                        ? current.filter(
                                                                              (
                                                                                  id,
                                                                              ) =>
                                                                                  id !==
                                                                                  image.id,
                                                                          )
                                                                        : [
                                                                              ...current,
                                                                              image.id,
                                                                          ],
                                                            );
                                                        }}
                                                        className={`absolute right-2 top-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-sm ${
                                                            markedForDelete
                                                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                : "bg-red-600 text-white hover:bg-red-700"
                                                        }`}
                                                    >
                                                        {markedForDelete
                                                            ? "Keep"
                                                            : "Delete"}
                                                    </button>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            )}

                            <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50">
                                <span className="text-sm font-semibold text-slate-700">
                                    + Add new photos
                                </span>

                                <span className="mt-1 block text-xs text-slate-500">
                                    Select up to 10 photos
                                    in total for this
                                    update.
                                </span>

                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(
                                        event,
                                    ) => {
                                        const files =
                                            Array.from(
                                                event
                                                    .target
                                                    .files ??
                                                    [],
                                            );

                                        setNewImages(
                                            (
                                                current,
                                            ) =>
                                                [
                                                    ...current,
                                                    ...files,
                                                ].slice(
                                                    0,
                                                    10,
                                                ),
                                        );

                                        event.currentTarget.value =
                                            "";
                                    }}
                                />
                            </label>

                            {newImages.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {newImages.map(
                                        (
                                            file,
                                            index,
                                        ) => (
                                            <div
                                                key={`${file.name}-${file.size}-${index}`}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                                            >
                                                <p className="min-w-0 truncate text-sm text-slate-700">
                                                    {
                                                        file.name
                                                    }
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setNewImages(
                                                            (
                                                                current,
                                                            ) =>
                                                                current.filter(
                                                                    (
                                                                        _,
                                                                        fileIndex,
                                                                    ) =>
                                                                        fileIndex !==
                                                                        index,
                                                                ),
                                                        )
                                                    }
                                                    className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>

                        {/* EXISTING DOCUMENTS */}

                        <div className="mt-8 border-t border-slate-100 pt-8">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Product documents
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Optional PDF documents
                                    related to the product.
                                </p>
                            </div>

                            {(product.productDocuments
                                ?.length ?? 0) > 0 && (
                                <div className="mt-4 space-y-2">
                                    {product.productDocuments?.map(
                                        (document) => {
                                            const markedForDelete =
                                                deleteDocumentIds.includes(
                                                    document.id,
                                                );

                                            return (
                                                <div
                                                    key={
                                                        document.id
                                                    }
                                                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                                                        markedForDelete
                                                            ? "border-red-300 bg-red-50 opacity-60"
                                                            : "border-slate-200"
                                                    }`}
                                                >
                                                    <a
                                                        href={getFileUrl(
                                                            document.filePath,
                                                        )}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="min-w-0 truncate text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                                    >
                                                        {document.filePath
                                                            .split(
                                                                /[\\/]/,
                                                            )
                                                            .pop() ??
                                                            "Product document"}
                                                    </a>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeleteDocumentIds(
                                                                (
                                                                    current,
                                                                ) =>
                                                                    current.includes(
                                                                        document.id,
                                                                    )
                                                                        ? current.filter(
                                                                              (
                                                                                  id,
                                                                              ) =>
                                                                                  id !==
                                                                                  document.id,
                                                                          )
                                                                        : [
                                                                              ...current,
                                                                              document.id,
                                                                          ],
                                                            );
                                                        }}
                                                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                                            markedForDelete
                                                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                : "bg-red-600 text-white hover:bg-red-700"
                                                        }`}
                                                    >
                                                        {markedForDelete
                                                            ? "Keep"
                                                            : "Delete"}
                                                    </button>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            )}

                            <label className="mt-4 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50">
                                <span className="text-sm font-semibold text-slate-700">
                                    + Add PDF documents
                                </span>

                                <span className="mt-1 block text-xs text-slate-500">
                                    Select up to 5
                                    documents.
                                </span>

                                <input
                                    type="file"
                                    accept="application/pdf"
                                    multiple
                                    className="hidden"
                                    onChange={(
                                        event,
                                    ) => {
                                        const files =
                                            Array.from(
                                                event
                                                    .target
                                                    .files ??
                                                    [],
                                            );

                                        setNewDocuments(
                                            (
                                                current,
                                            ) =>
                                                [
                                                    ...current,
                                                    ...files,
                                                ].slice(
                                                    0,
                                                    5,
                                                ),
                                        );

                                        event.currentTarget.value =
                                            "";
                                    }}
                                />
                            </label>

                            {newDocuments.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {newDocuments.map(
                                        (
                                            file,
                                            index,
                                        ) => (
                                            <div
                                                key={`${file.name}-${file.size}-${index}`}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                                            >
                                                <p className="min-w-0 truncate text-sm text-slate-700">
                                                    {
                                                        file.name
                                                    }
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setNewDocuments(
                                                            (
                                                                current,
                                                            ) =>
                                                                current.filter(
                                                                    (
                                                                        _,
                                                                        fileIndex,
                                                                    ) =>
                                                                        fileIndex !==
                                                                        index,
                                                                ),
                                                        )
                                                    }
                                                    className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* PICKUP LOCATION */}

                    <ProductLocationPicker
                        value={location}
                        onChange={(
                            updatedLocation,
                        ) => {
                            setLocation(
                                updatedLocation,
                            );
                        }}
                        onConfirmationChange={(
                            confirmed,
                        ) => {
                            setLocationConfirmed(
                                confirmed,
                            );
                        }}
                    />

                    {/* ACTIONS */}

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    `/products/${productId}`,
                                )
                            }
                            disabled={saving}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving
                                ? "Updating..."
                                : "Update Product"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}