"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";

import api from "@/app/lib/axios";
import ProductLocationPicker, {
    type ProductLocationData,
} from "@/app/products/ProductLocationPicker";
import type { Product } from "@/app/products/types/product";

interface ProductResponse {
    data: Product;
}

interface ProfileResponse {
    userId: string;
    role: string;
}

interface ValidationErrors {
    startDate?: string;
    rentalDays?: string;
    deliveryAddress?: string;
    deliveryLatitude?: string;
    deliveryLongitude?: string;
    locationConfirmed?: string;
    contactPhone?: string;
    renterMessage?: string;
    offeredPricePerDay?: string;
}

const EMPTY_LOCATION: ProductLocationData = {
    latitude: null,
    longitude: null,
    division: "",
    district: "",
    upazila: "",
    pickupAddress: "",
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000";

function getImageUrl(filePath?: string) {
    if (!filePath) return "";

    if (/^https?:\/\//i.test(filePath)) {
        return filePath;
    }

    return `${API_BASE_URL}/${filePath
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")}`;
}

function getDateInputMin(
    preparationBufferDays: number,
    allowSameDayRental: boolean,
) {
    const date = new Date();

    const daysToAdd = allowSameDayRental
        ? preparationBufferDays
        : Math.max(1, preparationBufferDays);

    date.setDate(date.getDate() + daysToAdd);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function createRentalRequestSchema(
    minRentalDays: number,
    maxRentalDays: number,
    minimumStartDate: string,
    negotiationAllowed: boolean,
) {
    return z
        .object({
            startDate: z
                .string()
                .min(1, "Please select a rental start date.")
                .refine(
                    (value) => value >= minimumStartDate,
                    `Rental must start from ${minimumStartDate} or later.`,
                ),

            rentalDays: z
                .number({
                    message: "Rental days must be a valid number.",
                })
                .int("Rental days must be a whole number.")
                .min(
                    minRentalDays,
                    `Rental duration must be at least ${minRentalDays} day(s).`,
                )
                .max(
                    maxRentalDays,
                    `Rental duration cannot exceed ${maxRentalDays} day(s).`,
                ),

            deliveryAddress: z
                .string()
                .trim()
                .min(
                    5,
                    "Please provide a valid delivery address.",
                ),

            deliveryLatitude: z
                .number({
                    message: "Please select a valid delivery location.",
                })
                .finite("Latitude must be a valid number.")
                .min(-90, "Invalid latitude.")
                .max(90, "Invalid latitude."),

            deliveryLongitude: z
                .number({
                    message: "Please select a valid delivery location.",
                })
                .finite("Longitude must be a valid number.")
                .min(-180, "Invalid longitude.")
                .max(180, "Invalid longitude."),

            locationConfirmed: z
                .boolean()
                .refine(
                    (confirmed) => confirmed,
                    "Please confirm your delivery location before submitting.",
                ),

            contactPhone: z
                .string()
                .trim()
                .regex(
                    /^(?:\+8801|01)[3-9]\d{8}$/,
                    "Please enter a valid Bangladeshi phone number.",
                ),

            renterMessage: z
                .string()
                .trim()
                .max(
                    1000,
                    "Message cannot exceed 1000 characters.",
                )
                .optional(),

            offeredPricePerDay: z
                .string()
                .trim()
                .refine(
                    (value) => {
                        if (!value) return true;

                        const price = Number(value);

                        return (
                            Number.isFinite(price) &&
                            price > 0
                        );
                    },
                    "Offered price must be greater than 0.",
                ),
        })
        .superRefine((data, ctx) => {
            if (
                data.offeredPricePerDay &&
                !negotiationAllowed
            ) {
                ctx.addIssue({
                    code: "custom",
                    path: ["offeredPricePerDay"],
                    message:
                        "Negotiation is not available for this product.",
                });
            }
        });
}

export default function CreateRentalRequestPage() {
    const params = useParams();
    const router = useRouter();

    const productId = params.productId as string;

    const [product, setProduct] =
        useState<Product | null>(null);

    const [loading, setLoading] = useState(true);

    const [authReady, setAuthReady] =
        useState(false);

    const [currentUserId, setCurrentUserId] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [validationErrors, setValidationErrors] =
        useState<ValidationErrors>({});

    const [startDate, setStartDate] =
        useState("");

    const [rentalDays, setRentalDays] =
        useState(1);

    const [deliveryLocation, setDeliveryLocation] =
        useState<ProductLocationData>(
            EMPTY_LOCATION,
        );

    const [locationConfirmed, setLocationConfirmed] =
        useState(false);

    const [contactPhone, setContactPhone] =
        useState("");

    const [renterMessage, setRenterMessage] =
        useState("");

    const [offeredPricePerDay, setOfferedPricePerDay] =
        useState("");

    useEffect(() => {
        let mounted = true;

        const loadProfile = async () => {
            try {
                const response =
                    await api.get<ProfileResponse>(
                        "/auth/profile",
                    );

                if (
                    mounted &&
                    response.data?.userId
                ) {
                    setCurrentUserId(
                        response.data.userId,
                    );
                }
            } catch (err) {
                console.error(
                    "Failed to load authenticated user:",
                    err,
                );
            } finally {
                if (mounted) {
                    setAuthReady(true);
                }
            }
        };

        loadProfile();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!productId) return;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await api.get<ProductResponse>(
                        `/products/${encodeURIComponent(
                            productId,
                        )}`,
                    );

                const productData =
                    response.data.data;

                setProduct(productData);

                const minDays = Number(
                    productData.minRentalDays ?? 1,
                );

                setRentalDays(minDays);

                if (productData.location) {
                    setDeliveryLocation({
                        latitude: Number(
                            productData.location.latitude,
                        ),

                        longitude: Number(
                            productData.location.longitude,
                        ),

                        division:
                            productData.location
                                .division ?? "",

                        district:
                            productData.location
                                .district ?? "",

                        upazila:
                            productData.location
                                .upazila ?? "",

                        pickupAddress: "",
                    });
                }
            } catch (err: any) {
                console.error(
                    "Failed to fetch product:",
                    err,
                );

                setError(
                    err?.response?.data?.message ||
                        "Failed to load product information.",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const minRentalDays = Number(
        product?.minRentalDays ?? 1,
    );

    const maxRentalDays = Number(
        product?.maxRentalDays ?? 30,
    );

    const pricePerDay = Number(
        product?.pricePerDay ?? 0,
    );

    const minimumStartDate = useMemo(() => {
        if (!product) return "";

        return getDateInputMin(
            Number(
                product.preparationBufferDays ?? 0,
            ),
            Boolean(product.allowSameDayRental),
        );
    }, [product]);

    const estimatedRentalAmount = useMemo(() => {
        const price =
            offeredPricePerDay.trim()
                ? Number(offeredPricePerDay)
                : pricePerDay;

        if (
            !Number.isFinite(price) ||
            !Number.isFinite(rentalDays)
        ) {
            return 0;
        }

        return price * rentalDays;
    }, [
        offeredPricePerDay,
        pricePerDay,
        rentalDays,
    ]);

    const handleLocationChange = (
        location: ProductLocationData,
    ) => {
        setDeliveryLocation(location);

        setLocationConfirmed(false);

        setError("");

        setValidationErrors((prev) => ({
            ...prev,
            deliveryAddress: undefined,
            deliveryLatitude: undefined,
            deliveryLongitude: undefined,
            locationConfirmed: undefined,
        }));
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!product) return;

        setError("");
        setSuccess("");
        setValidationErrors({});

        if (!currentUserId) {
            setError(
                "Your login session could not be verified. Please login again.",
            );
            return;
        }

        if (currentUserId === product.ownerId) {
            setError(
                "You cannot rent your own product.",
            );
            return;
        }

        const validationResult =
            createRentalRequestSchema(
                minRentalDays,
                maxRentalDays,
                minimumStartDate,
                product.negotiationAllowed,
            ).safeParse({
                startDate,
                rentalDays,

                deliveryAddress:
                    deliveryLocation.pickupAddress,

                deliveryLatitude:
                    deliveryLocation.latitude,

                deliveryLongitude:
                    deliveryLocation.longitude,

                locationConfirmed,

                contactPhone,

                renterMessage:
                    renterMessage.trim() ||
                    undefined,

                offeredPricePerDay,
            });

        if (!validationResult.success) {
            const errors: ValidationErrors = {};

            validationResult.error.issues.forEach(
                (issue) => {
                    const field =
                        issue.path[0] as keyof ValidationErrors;

                    if (!errors[field]) {
                        errors[field] =
                            issue.message;
                    }
                },
            );

            setValidationErrors(errors);

            return;
        }

        const validated =
            validationResult.data;

        try {
            setSubmitting(true);

            // -------------------------------------------------
            // Backend CreateRentalRequestDto compatible payload
            // -------------------------------------------------

            const payload: {
                productId: string;
                startDate: string;
                rentalDays: number;
                deliveryAddress: string;
                deliveryLatitude: number;
                deliveryLongitude: number;
                contactPhone: string;
                renterMessage?: string;
                offeredPricePerDay?: number;
            } = {
                productId:
                    product.productId,

                startDate:
                    validated.startDate,

                rentalDays:
                    validated.rentalDays,

                deliveryAddress:
                    validated.deliveryAddress,

                deliveryLatitude:
                    Number(
                        validated.deliveryLatitude,
                    ),

                deliveryLongitude:
                    Number(
                        validated.deliveryLongitude,
                    ),

                contactPhone:
                    validated.contactPhone,
            };

            if (
                validated.renterMessage
            ) {
                payload.renterMessage =
                    validated.renterMessage;
            }

            if (
                validated.offeredPricePerDay &&
                validated.offeredPricePerDay.trim() !== ""
            ) {
                payload.offeredPricePerDay =
                    Number(
                        validated.offeredPricePerDay,
                    );
            }

            const response =
                await api.post(
                    "/rental/request",
                    payload,
                );

            setSuccess(
                "Rental request created successfully.",
            );

            const rentalRequestId =
                response?.data
                    ?.rentalRequestId ||
                response?.data?.data
                    ?.rentalRequestId;

            if (rentalRequestId) {
                setTimeout(() => {
                    router.push(
                        `/rental-requests/${rentalRequestId}`,
                    );
                }, 700);
            }
        } catch (err: any) {
            console.error(
                "Failed to create rental request:",
                err,
            );

            const backendMessage =
                err?.response?.data?.message;

            if (Array.isArray(backendMessage)) {
                setError(
                    backendMessage.join(", "),
                );
            } else {
                setError(
                    backendMessage ||
                        "Failed to create rental request.",
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !authReady) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-72 rounded bg-slate-200" />

                        <div className="h-36 rounded-2xl bg-slate-200" />

                        <div className="h-[700px] rounded-2xl bg-slate-200" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Product not found
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            {error ||
                                "Unable to load this product."}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.back()
                            }
                            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (currentUserId === product.ownerId) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
                    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
                            !
                        </div>

                        <h1 className="mt-5 text-2xl font-bold text-slate-900">
                            You cannot rent your own product
                        </h1>

                        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                            You are the owner of this product, so you cannot create a rental request for it.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.back()
                            }
                            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const productImage = getImageUrl(
        product.productImages?.[0]?.filePath,
    );

    const productLocation =
        product.location;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">

                {/* Header */}

                <div className="mb-7">
                    <button
                        type="button"
                        onClick={() =>
                            router.back()
                        }
                        className="mb-4 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                    >
                        ← Back to Product
                    </button>

                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Request to Rent
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Choose your rental period, delivery location, and request details.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">

                    {/* Main Form */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >

                        {/* General Error */}

                        {error && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Success */}

                        {success && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                                {success}
                            </div>
                        )}

                        {/* Rental Period */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

                            <div className="mb-6 flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                                    📅
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Rental Period
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Select when and how long you need the product.
                                    </p>
                                </div>

                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">

                                {/* Start Date */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Start Date
                                    </label>

                                    <input
                                        type="date"
                                        min={minimumStartDate}
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(
                                                e.target.value,
                                            );

                                            setValidationErrors(
                                                (prev) => ({
                                                    ...prev,
                                                    startDate:
                                                        undefined,
                                                }),
                                            );
                                        }}
                                        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                                            validationErrors.startDate
                                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                                                : "border-slate-300 focus:border-slate-900 focus:ring-slate-900/10"
                                        }`}
                                    />

                                    <p className="mt-2 text-xs text-slate-500">
                                        Earliest available date:{" "}
                                        {minimumStartDate}
                                    </p>

                                    {validationErrors.startDate && (
                                        <p className="mt-2 text-sm font-medium text-red-600">
                                            {
                                                validationErrors.startDate
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Rental Days */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Rental Days
                                    </label>

                                    <input
                                        type="number"
                                        min={minRentalDays}
                                        max={maxRentalDays}
                                        value={rentalDays}
                                        onChange={(e) => {
                                            setRentalDays(
                                                Number(
                                                    e.target.value,
                                                ),
                                            );

                                            setValidationErrors(
                                                (prev) => ({
                                                    ...prev,
                                                    rentalDays:
                                                        undefined,
                                                }),
                                            );
                                        }}
                                        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                                            validationErrors.rentalDays
                                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                                                : "border-slate-300 focus:border-slate-900 focus:ring-slate-900/10"
                                        }`}
                                    />

                                    <p className="mt-2 text-xs text-slate-500">
                                        Allowed duration:{" "}
                                        <strong>
                                            {minRentalDays}
                                        </strong>
                                        –
                                        <strong>
                                            {maxRentalDays}
                                        </strong>{" "}
                                        days.
                                    </p>

                                    {validationErrors.rentalDays && (
                                        <p className="mt-2 text-sm font-medium text-red-600">
                                            {
                                                validationErrors.rentalDays
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Price Summary */}

                            <div className="mt-5 grid gap-3 sm:grid-cols-3">

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs font-medium text-slate-500">
                                        Listed price
                                    </p>

                                    <p className="mt-1 text-lg font-bold text-slate-900">
                                        ৳
                                        {pricePerDay.toFixed(
                                            2,
                                        )}
                                        /day
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs font-medium text-slate-500">
                                        Estimated rental
                                    </p>

                                    <p className="mt-1 text-lg font-bold text-slate-900">
                                        ৳
                                        {estimatedRentalAmount.toFixed(
                                            2,
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs font-medium text-slate-500">
                                        Same-day rental
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-slate-900">
                                        {product.allowSameDayRental
                                            ? "Allowed"
                                            : "Not allowed"}
                                    </p>
                                </div>

                            </div>
                        </section>

                        {/* Delivery Location */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

                            <div className="mb-6 flex items-center justify-between gap-4">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                                        📍
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Delivery Location
                                        </h2>

                                        <p className="text-sm text-slate-500">
                                            Select the exact place where you want the product delivered.
                                        </p>
                                    </div>

                                </div>

                                {locationConfirmed && (
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                        Location confirmed
                                    </span>
                                )}

                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">

                                <ProductLocationPicker
                                    value={
                                        deliveryLocation
                                    }
                                    onChange={
                                        handleLocationChange
                                    }
                                    onConfirmationChange={(
                                        confirmed,
                                    ) => {
                                        setLocationConfirmed(
                                            confirmed,
                                        );

                                        if (
                                            confirmed
                                        ) {
                                            setValidationErrors(
                                                (prev) => ({
                                                    ...prev,
                                                    locationConfirmed:
                                                        undefined,
                                                }),
                                            );
                                        }
                                    }}
                                />

                            </div>

                            {(
                                validationErrors
                                    .deliveryLatitude ||
                                validationErrors
                                    .deliveryLongitude ||
                                validationErrors
                                    .locationConfirmed ||
                                validationErrors
                                    .deliveryAddress
                            ) && (
                                <div className="mt-3 space-y-1">
                                    {validationErrors.deliveryLatitude && (
                                        <p className="text-sm font-medium text-red-600">
                                            {
                                                validationErrors.deliveryLatitude
                                            }
                                        </p>
                                    )}

                                    {validationErrors.deliveryLongitude && (
                                        <p className="text-sm font-medium text-red-600">
                                            {
                                                validationErrors.deliveryLongitude
                                            }
                                        </p>
                                    )}

                                    {validationErrors.deliveryAddress && (
                                        <p className="text-sm font-medium text-red-600">
                                            {
                                                validationErrors.deliveryAddress
                                            }
                                        </p>
                                    )}

                                    {validationErrors.locationConfirmed && (
                                        <p className="text-sm font-medium text-red-600">
                                            {
                                                validationErrors.locationConfirmed
                                            }
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Coordinates */}

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">

                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <p className="text-xs font-medium text-slate-500">
                                        Latitude
                                    </p>

                                    <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
                                        {deliveryLocation.latitude ??
                                            "Not selected"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <p className="text-xs font-medium text-slate-500">
                                        Longitude
                                    </p>

                                    <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
                                        {deliveryLocation.longitude ??
                                            "Not selected"}
                                    </p>
                                </div>

                            </div>

                            {/* Delivery Address */}

                            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">

                                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                                    Delivery address
                                </p>

                                <p className="mt-1 text-sm leading-6 text-blue-950">
                                    {deliveryLocation.pickupAddress ||
                                        "Select a location and confirm it to see the delivery address."}
                                </p>

                            </div>

                            {/* Product Pickup Area */}

                            {productLocation && (
                                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">

                                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                                        Product pickup area
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-amber-950">
                                        {productLocation.pickupAddress ||
                                            "Pickup location available from the product owner."}
                                    </p>

                                </div>
                            )}

                        </section>

                        {/* Contact Information */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

                            <div className="mb-6 flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl">
                                    📞
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Contact Information
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        The owner will use this information for the rental process.
                                    </p>
                                </div>

                            </div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Contact Phone
                            </label>

                            <input
                                type="tel"
                                value={contactPhone}
                                onChange={(e) => {
                                    setContactPhone(
                                        e.target.value,
                                    );

                                    setValidationErrors(
                                        (prev) => ({
                                            ...prev,
                                            contactPhone:
                                                undefined,
                                        }),
                                    );
                                }}
                                placeholder="01XXXXXXXXX"
                                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                                    validationErrors.contactPhone
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                                        : "border-slate-300 focus:border-slate-900 focus:ring-slate-900/10"
                                }`}
                            />

                            <p className="mt-2 text-xs text-slate-500">
                                Example: 01712345678
                            </p>

                            {validationErrors.contactPhone && (
                                <p className="mt-2 text-sm font-medium text-red-600">
                                    {
                                        validationErrors.contactPhone
                                    }
                                </p>
                            )}

                        </section>

                        {/* Negotiation */}

                        {product.negotiationAllowed && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

                                <div className="mb-5 flex items-center gap-3">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl">
                                        💰
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Price Negotiation
                                        </h2>

                                        <p className="text-sm text-slate-500">
                                            You can optionally make an initial offer.
                                        </p>
                                    </div>

                                </div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Your Offer Per Day
                                </label>

                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={
                                        offeredPricePerDay
                                    }
                                    onChange={(e) => {
                                        setOfferedPricePerDay(
                                            e.target.value,
                                        );

                                        setValidationErrors(
                                            (prev) => ({
                                                ...prev,
                                                offeredPricePerDay:
                                                    undefined,
                                            }),
                                        );
                                    }}
                                    placeholder={`Listed price: ৳${pricePerDay.toFixed(
                                        2,
                                    )}`}
                                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                                        validationErrors.offeredPricePerDay
                                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                                            : "border-slate-300 focus:border-slate-900 focus:ring-slate-900/10"
                                    }`}
                                />

                                <p className="mt-2 text-xs text-slate-500">
                                    Leave empty to request the listed price of ৳
                                    {pricePerDay.toFixed(
                                        2,
                                    )}{" "}
                                    per day.
                                </p>

                                {validationErrors.offeredPricePerDay && (
                                    <p className="mt-2 text-sm font-medium text-red-600">
                                        {
                                            validationErrors.offeredPricePerDay
                                        }
                                    </p>
                                )}

                            </section>
                        )}

                        {/* Message */}

                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

                            <div className="mb-5 flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
                                    💬
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Message
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        Add any useful information for the product owner.
                                    </p>
                                </div>

                            </div>

                            <textarea
                                value={renterMessage}
                                onChange={(e) => {
                                    setRenterMessage(
                                        e.target.value,
                                    );

                                    setValidationErrors(
                                        (prev) => ({
                                            ...prev,
                                            renterMessage:
                                                undefined,
                                        }),
                                    );
                                }}
                                rows={5}
                                placeholder="Write a message to the product owner..."
                                className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                                    validationErrors.renterMessage
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                                        : "border-slate-300 focus:border-slate-900 focus:ring-slate-900/10"
                                }`}
                            />

                            <div className="mt-2 flex items-center justify-between">

                                {validationErrors.renterMessage ? (
                                    <p className="text-sm font-medium text-red-600">
                                        {
                                            validationErrors.renterMessage
                                        }
                                    </p>
                                ) : (
                                    <span />
                                )}

                                <span
                                    className={`text-xs ${
                                        renterMessage.length >
                                        1000
                                            ? "text-red-600"
                                            : "text-slate-400"
                                    }`}
                                >
                                    {renterMessage.length}/1000
                                </span>

                            </div>

                        </section>

                        {/* Submit */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                <div>
                                    <p className="text-sm font-bold text-slate-900">
                                        Ready to send your request?
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Review your rental period and confirm your delivery location first.
                                    </p>
                                </div>

                                <div className="flex gap-3">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.back()
                                        }
                                        disabled={
                                            submitting
                                        }
                                        className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            submitting ||
                                            !locationConfirmed
                                        }
                                        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {submitting
                                            ? "Submitting..."
                                            : "Submit Rental Request"}
                                    </button>

                                </div>

                            </div>
                        </div>

                    </form>

                    {/* Sidebar */}

                    <aside className="lg:sticky lg:top-6 lg:self-start">

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                            <div className="h-56 bg-slate-100">

                                {productImage ? (
                                    <img
                                        src={
                                            productImage
                                        }
                                        alt={
                                            product.name
                                        }
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                                        No product image
                                    </div>
                                )}

                            </div>

                            <div className="p-6">

                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Product
                                </p>

                                <h2 className="mt-2 text-xl font-bold text-slate-900">
                                    {product.name}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {product.productId}
                                </p>

                                <div className="mt-5 border-t border-slate-100 pt-5">

                                    <div className="flex items-end justify-between">

                                        <span className="text-sm text-slate-500">
                                            Price per day
                                        </span>

                                        <span className="text-xl font-bold text-slate-900">
                                            ৳
                                            {pricePerDay.toFixed(
                                                2,
                                            )}
                                        </span>

                                    </div>

                                </div>

                                <div className="mt-5 space-y-3">

                                    <div className="flex items-start justify-between gap-4 text-sm">
                                        <span className="text-slate-500">
                                            Rental range
                                        </span>

                                        <span className="font-semibold text-slate-900">
                                            {minRentalDays}–
                                            {maxRentalDays}{" "}
                                            days
                                        </span>
                                    </div>

                                    <div className="flex items-start justify-between gap-4 text-sm">
                                        <span className="text-slate-500">
                                            Negotiation
                                        </span>

                                        <span className="font-semibold text-slate-900">
                                            {product.negotiationAllowed
                                                ? "Available"
                                                : "Not available"}
                                        </span>
                                    </div>

                                    <div className="flex items-start justify-between gap-4 text-sm">
                                        <span className="text-slate-500">
                                            Preparation
                                        </span>

                                        <span className="font-semibold text-slate-900">
                                            {product.preparationBufferDays ??
                                                0}{" "}
                                            day(s)
                                        </span>
                                    </div>

                                </div>

                                <div className="mt-6 rounded-xl bg-slate-50 p-4">

                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Request summary
                                    </p>

                                    <div className="mt-3 space-y-2 text-sm">

                                        <div className="flex justify-between gap-3">
                                            <span className="text-slate-500">
                                                Days
                                            </span>

                                            <span className="font-semibold text-slate-900">
                                                {rentalDays}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-slate-500">
                                                Estimated rental
                                            </span>

                                            <span className="font-semibold text-slate-900">
                                                ৳
                                                {estimatedRentalAmount.toFixed(
                                                    2,
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-slate-500">
                                                Location
                                            </span>

                                            <span
                                                className={`font-semibold ${
                                                    locationConfirmed
                                                        ? "text-emerald-600"
                                                        : "text-amber-600"
                                                }`}
                                            >
                                                {locationConfirmed
                                                    ? "Confirmed"
                                                    : "Pending"}
                                            </span>
                                        </div>

                                    </div>

                                </div>

                            </div>
                        </div>

                    </aside>

                </div>
            </div>
        </div>
    );
}