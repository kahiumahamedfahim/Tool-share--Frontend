"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import api from "@/app/lib/axios";
import { createRentalRequest } from "@/app/lib/rental-api";
import {
    getRenterActiveRequestForProduct,
    type ActiveRentalRequestInfo,
} from "@/app/lib/rental-api";
import type { CreateRentalRequestPayload } from "@/app/lib/rental-api";

const ProductMap = dynamic(
    () => import("../../ProductMap"),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[380px] items-center justify-center rounded-2xl bg-slate-100">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

                    <p className="mt-3 text-sm text-slate-500">
                        Loading map...
                    </p>
                </div>
            </div>
        ),
    },
);

/* =====================================================
   TYPES
===================================================== */

interface ProductResponse {
    productId: string;
    name: string;
    description?: string;

    pricePerDay: number | string;

    minRentalDays?: number;
    maxRentalDays?: number;

    rentalMinDays?: number;
    rentalMaxDays?: number;

    negotiationAllowed?: boolean;

    securityDeposit?: number | string;

    pickupAddress?: string;

    pickupLatitude?: number | string | null;
    pickupLongitude?: number | string | null;

    images?: Array<{
        imageUrl?: string;
        url?: string;
    }>;

    owner?: {
        userId?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
    };

    location?: {
        pickupAddress?: string;
    };

    category?: {
        name?: string;
    };
}

interface ApiProductResponse {
    data: ProductResponse;
}

/* =====================================================
   PAGE
===================================================== */

export default function CreateRentalRequestPage() {
    const params = useParams();
    const router = useRouter();
    const [authChecking, setAuthChecking] = useState(true);
    useEffect(() => {
    const checkUserAccess = async () => {
        try {
            const response = await api.get("/auth/profile", 
                {
                withCredentials: true,
            });

            const role = response.data.role;

            if (role !== "USER") {
                router.replace("/login");
                return;
            }

            setAuthChecking(false);
        } catch (error) {
            console.error("Authentication check failed:", error);

            router.replace("/login");
        }
    };

    checkUserAccess();
}, [router]);

    const productId = params?.productId as string;

    /* =================================================
       PRODUCT
    ================================================= */

    const [product, setProduct] =
        useState<ProductResponse | null>(null);

    const [loadingProduct, setLoadingProduct] =
        useState(true);

    /* =================================================
       FORM
    ================================================= */

    const [startDate, setStartDate] =
        useState("");

    const [rentalDays, setRentalDays] =
        useState(1);

    const [deliveryLatitude, setDeliveryLatitude] =
        useState<number | null>(null);

    const [deliveryLongitude, setDeliveryLongitude] =
        useState<number | null>(null);

    const [deliveryAddress, setDeliveryAddress] =
        useState("");

    const [contactPhone, setContactPhone] =
        useState("");

    const [offeredPricePerDay, setOfferedPricePerDay] =
        useState<number | "">("");

    const [renterMessage, setRenterMessage] =
        useState("");

    /* =================================================
       UI STATES
    ================================================= */

    const [submitting, setSubmitting] =
        useState(false);

    const [locationLoading, setLocationLoading] =
        useState(false);

    const [locationError, setLocationError] =
        useState("");

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [agreeToTerms, setAgreeToTerms] =
        useState(false);
        

    /* =================================================
       EXISTING ACTIVE REQUEST
       Prevents duplicate rental requests
       while the owner has not responded.
    ================================================= */

    const [activeRequest, setActiveRequest] =
        useState<ActiveRentalRequestInfo | null>(
            null,
        );

    useEffect(() => {
        if (!productId) {
            return;
        }

        const checkActiveRequest = async () => {
            try {
                const data =
                    await getRenterActiveRequestForProduct(
                        productId,
                    );

                setActiveRequest(data);
            } catch (err) {
                /*
                 * Fail open: if the check cannot be
                 * performed (e.g. auth issues), the
                 * backend still enforces the rule.
                 */
                console.error(
                    "Failed to check existing rental request:",
                    err,
                );
            }
        };

        checkActiveRequest();
    }, [productId]);

    /* =================================================
       FETCH PRODUCT
    ================================================= */

    useEffect(() => {
        if (!productId) {
            return;
        }

        const fetchProduct = async () => {
            try {
                setLoadingProduct(true);
                setError("");

                const response =
                    await api.get<ApiProductResponse>(
                        `/products/${productId}`,
                    );

                const productData =
                    response.data?.data ??
                    (response.data as unknown as ProductResponse);

                setProduct(productData);

                setRentalDays(
                    productData.minRentalDays ??
                        productData.rentalMinDays ??
                        1,
                );
            } catch (err: any) {
                console.error(
                    "Failed to fetch product:",
                    err,
                );

                setError(
                    err?.response?.data?.message ||
                        "Unable to load this product.",
                );
            } finally {
                setLoadingProduct(false);
            }
        };

        fetchProduct();
    }, [productId]);

    /* =================================================
       RENTAL LIMITS
    ================================================= */

    const minRentalDays = useMemo(
        () =>
            product?.minRentalDays ??
            product?.rentalMinDays ??
            1,
        [product],
    );

    const maxRentalDays = useMemo(
        () =>
            product?.maxRentalDays ??
            product?.rentalMaxDays ??
            365,
        [product],
    );

    /* =================================================
       TODAY
    ================================================= */

    const today = useMemo(() => {
        const date = new Date();

        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1,
        ).padStart(2, "0");

        const day = String(
            date.getDate(),
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }, []);

    /* =================================================
       END DATE
    ================================================= */

    const calculatedEndDate = useMemo(() => {
        if (!startDate || !rentalDays) {
            return "";
        }

        const date = new Date(
            `${startDate}T00:00:00`,
        );

        date.setDate(
            date.getDate() + Number(rentalDays),
        );

        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1,
        ).padStart(2, "0");

        const day = String(
            date.getDate(),
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }, [startDate, rentalDays]);

    /* =================================================
       PRICING
    ================================================= */

    const listedPricePerDay = Number(
        product?.pricePerDay ?? 0,
    );

    const effectivePricePerDay =
        offeredPricePerDay !== ""
            ? Number(offeredPricePerDay)
            : listedPricePerDay;

    const estimatedRentalAmount =
        effectivePricePerDay *
        Number(rentalDays);

    /* =================================================
       REVERSE GEOCODING
    ================================================= */

    const reverseGeocode = async (
        latitude: number,
        longitude: number,
    ) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        Accept: "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error(
                    "Reverse geocoding failed",
                );
            }

            const data = await response.json();

            if (data?.display_name) {
                setDeliveryAddress(
                    data.display_name,
                );
            }
        } catch (error) {
            console.error(
                "Reverse geocoding error:",
                error,
            );

            setLocationError(
                "Location selected, but the address could not be detected. Please enter it manually.",
            );
        }
    };

    /* =================================================
       CURRENT LOCATION
    ================================================= */

    const handleUseCurrentLocation = () => {
        setLocationError("");

        if (!navigator.geolocation) {
            setLocationError(
                "Geolocation is not supported by your browser.",
            );

            return;
        }

        setLocationLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                setDeliveryLatitude(latitude);
                setDeliveryLongitude(longitude);

                await reverseGeocode(
                    latitude,
                    longitude,
                );

                setLocationLoading(false);
            },
            (geoError) => {
                console.error(
                    "Geolocation error:",
                    geoError,
                );

                let message =
                    "Unable to detect your current location.";

                if (
                    geoError.code ===
                    geoError.PERMISSION_DENIED
                ) {
                    message =
                        "Location permission was denied. Please allow location access from your browser.";
                } else if (
                    geoError.code ===
                    geoError.POSITION_UNAVAILABLE
                ) {
                    message =
                        "Your current location is unavailable.";
                } else if (
                    geoError.code ===
                    geoError.TIMEOUT
                ) {
                    message =
                        "Location detection timed out. Please try again.";
                }

                setLocationError(message);
                setLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            },
        );
    };

    /* =================================================
       MAP LOCATION
    ================================================= */

    const handleLocationChange = async (
        latitude: number,
        longitude: number,
    ) => {
        setDeliveryLatitude(latitude);
        setDeliveryLongitude(longitude);

        setLocationError("");

        await reverseGeocode(
            latitude,
            longitude,
        );
    };

    /* =================================================
       VALIDATION
    ================================================= */

    const validateForm = () => {
        setError("");

        if (!product) {
            setError(
                "Product information is unavailable.",
            );

            return false;
        }

        if (!startDate) {
            setError(
                "Please select your rental start date.",
            );

            return false;
        }

        if (startDate < today) {
            setError(
                "Rental start date cannot be in the past.",
            );

            return false;
        }

        if (
            rentalDays < minRentalDays ||
            rentalDays > maxRentalDays
        ) {
            setError(
                `Rental duration must be between ${minRentalDays} and ${maxRentalDays} days.`,
            );

            return false;
        }

        if (
            deliveryLatitude === null ||
            deliveryLongitude === null
        ) {
            setError(
                "Please select your delivery location.",
            );

            return false;
        }

        if (!deliveryAddress.trim()) {
            setError(
                "Please enter your delivery address.",
            );

            return false;
        }

        if (!contactPhone.trim()) {
            setError(
                "Please enter your contact phone number.",
            );

            return false;
        }

        if (
            offeredPricePerDay !== "" &&
            Number(offeredPricePerDay) <= 0
        ) {
            setError(
                "Offered price must be greater than 0.",
            );

            return false;
        }

        if (
            offeredPricePerDay !== "" &&
            !product.negotiationAllowed
        ) {
            setError(
                "Negotiation is not available for this product.",
            );

            return false;
        }

        if (!agreeToTerms) {
            setError(
                "Please agree to the rental terms before submitting.",
            );

            return false;
        }

        return true;
    };

    /* =================================================
       SUBMIT
    ================================================= */

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (
            deliveryLatitude === null ||
            deliveryLongitude === null
        ) {
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            const payload: CreateRentalRequestPayload =
                {
                    productId,

                    startDate,

                    rentalDays:
                        Number(rentalDays),

                    deliveryAddress:
                        deliveryAddress.trim(),

                    deliveryLatitude,

                    deliveryLongitude,

                    contactPhone:
                        contactPhone.trim(),

                    ...(renterMessage.trim()
                        ? {
                              renterMessage:
                                  renterMessage.trim(),
                          }
                        : {}),

                    ...(offeredPricePerDay !==
                    ""
                        ? {
                              offeredPricePerDay:
                                  Number(
                                      offeredPricePerDay,
                                  ),
                          }
                        : {}),
                };

            const result =
                await createRentalRequest(
                    payload,
                );

            setSuccess(
                "Rental request submitted successfully.",
            );

            setTimeout(() => {
                router.push(
                    `/rentals/request/${result.rentalRequestId}`,
                );
            }, 1200);
        } catch (err: any) {
            console.error(
                "Create rental request error:",
                err,
            );

            const message =
                err?.response?.data?.message;

            if (Array.isArray(message)) {
                setError(
                    message.join(", "),
                );
            } else {
                setError(
                    message ||
                        "Failed to submit rental request.",
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    /* =================================================
       LOADING
    ================================================= */

    if (loadingProduct) {
        return (
            <>
                <RoleBasedNavbar />

                <main className="min-h-screen bg-slate-50 px-4 py-10">
                    <div className="mx-auto max-w-7xl">
                        <div className="animate-pulse space-y-6">
                            <div className="h-10 w-72 rounded-lg bg-slate-200" />

                            <div className="h-40 rounded-2xl bg-slate-200" />

                            <div className="h-80 rounded-2xl bg-slate-200" />
                        </div>
                    </div>
                </main>
            </>
        );
    }

    /* =================================================
       PRODUCT NOT FOUND
    ================================================= */

    if (!product) {
        return (
            <>
                <RoleBasedNavbar />

                <main className="min-h-screen bg-slate-50 px-4 py-10">
                    <div className="mx-auto max-w-3xl">
                        <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                !
                            </div>

                            <h1 className="mt-5 text-2xl font-bold text-slate-950">
                                Product unavailable
                            </h1>

                            <p className="mt-2 text-sm text-slate-600">
                                {error ||
                                    "Unable to load this product."}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    router.back()
                                }
                                className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Go back
                            </button>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    /* =================================================
       ALREADY SENT — ACTIVE REQUEST EXISTS
    ================================================= */

    if (activeRequest?.exists) {
        const statusConfigByRequestStatus: Record<
            NonNullable<ActiveRentalRequestInfo["status"]>,
            { label: string; tone: string }
        > = {
            PENDING: {
                label: "Waiting for owner response",
                tone: "border-amber-200 bg-amber-50 text-amber-700",
            },

            NEGOTIATING: {
                label: "Negotiation in progress",
                tone: "border-blue-200 bg-blue-50 text-blue-700",
            },

            PRICE_AGREED: {
                label: "Price agreed — waiting for moderator review",
                tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
            },

            CHARGES_PROPOSED: {
                label: "Charges proposed — awaiting your confirmation",
                tone: "border-blue-200 bg-blue-50 text-blue-700",
            },

            APPROVED: {
                label: "Approved",
                tone: "border-blue-200 bg-blue-50 text-blue-700",
            },

            REJECTED: {
                label: "Rejected",
                tone: "border-red-200 bg-red-50 text-red-700",
            },

            EXPIRED: {
                label: "Expired",
                tone: "border-slate-200 bg-slate-100 text-slate-600",
            },
        };

        const statusMeta =
            activeRequest.status &&
            statusConfigByRequestStatus[activeRequest.status]
                ? statusConfigByRequestStatus[activeRequest.status]
                : null;

        return (
            <>
                <RoleBasedNavbar />

                <main className="min-h-screen bg-slate-50 px-4 py-10">
                    <div className="mx-auto max-w-2xl">
                        <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-600">
                                ⏳
                            </div>

                            <h1 className="mt-5 text-2xl font-bold text-slate-950">
                                Rental request already sent
                            </h1>

                            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                                You have already sent a rental
                                request for this product. Please
                                wait for the owner&apos;s response.
                                You can track your request and
                                negotiate from the request details
                                page.
                            </p>

                            {statusMeta && (
                                <span
                                    className={`mt-4 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusMeta.tone}`}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />

                                    {statusMeta.label}
                                </span>
                            )}

                            <div className="mt-6 flex flex-wrap gap-3">
                                {activeRequest.rentalRequestId && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.push(
                                                `/rentals/request/${activeRequest.rentalRequestId}`,
                                            )
                                        }
                                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        View my request
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            "/rentals/my-requests",
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    My rental requests
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    /* =================================================
       UI
    ================================================= */

    return (
        <>
            <RoleBasedNavbar />

            <main className="min-h-screen bg-slate-50">
                {/* ======================================
                    PAGE HEADER
                ====================================== */}

                <div className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
                        <button
                            type="button"
                            onClick={() =>
                                router.back()
                            }
                            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                        >
                            <span className="text-lg">
                                ←
                            </span>

                            Back to product
                        </button>

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                                    Rental Request
                                </div>

                                <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                                    Request to rent
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                                    Provide your rental
                                    details and delivery
                                    location. The product
                                    owner will review your
                                    request.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Listed rate
                                </p>

                                <p className="mt-1 text-2xl font-bold text-slate-950">
                                    ৳
                                    {listedPricePerDay.toLocaleString()}
                                    <span className="ml-1 text-sm font-medium text-slate-500">
                                        / day
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
                    <form
                        onSubmit={handleSubmit}
                        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
                    >
                        {/* =================================
                            MAIN CONTENT
                        ================================= */}

                        <div className="space-y-6">

                            {/* PRODUCT */}
                            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                                            ▦
                                        </div>

                                        <div>
                                            <h2 className="text-base font-semibold text-slate-950">
                                                Product
                                            </h2>

                                            <p className="text-xs text-slate-500">
                                                Rental item
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                Product ID
                                            </p>

                                            <p className="mt-1 text-xs font-medium text-slate-600">
                                                {
                                                    product.productId
                                                }
                                            </p>

                                            <h3 className="mt-2 text-xl font-semibold text-slate-950">
                                                {
                                                    product.name
                                                }
                                            </h3>
                                        </div>

                                        <div className="sm:text-right">
                                            <p className="text-xs text-slate-500">
                                                Listed price
                                            </p>

                                            <p className="mt-1 text-xl font-bold text-slate-950">
                                                ৳
                                                {listedPricePerDay.toLocaleString()}
                                                <span className="text-xs font-medium text-slate-500">
                                                    {" "}
                                                    / day
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {product.description && (
                                        <p className="mt-4 text-sm leading-6 text-slate-600">
                                            {
                                                product.description
                                            }
                                        </p>
                                    )}
                                </div>
                            </section>

                            {/* OWNER */}
                            <section
                                className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                            >
                                <div className="border-b border-slate-100 px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                                            👤
                                        </div>

                                        <div>
                                            <h2 className="text-base font-semibold text-slate-950">
                                                Product owner
                                            </h2>

                                            <p className="text-xs text-slate-500">
                                                Verification and
                                                contact information
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xl">
                                            {
                                                (
                                                    product.owner?.firstName
                                                        ?.charAt(0) ??
                                                    ""
                                                ) +
                                                (
                                                    product.owner?.lastName
                                                        ?.charAt(0) ??
                                                    ""
                                                )
                                            }
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-slate-950">
                                                {
                                                    product.owner
                                                        ?.firstName
                                                }
                                                {
                                                    product.owner?.lastName
                                                }
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                                Verified owner
                                            </p>

                                            {product.owner?.phone && (
                                                <p className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                                                    ☎
                                                    {
                                                        product.owner.phone
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Location
                                            </p>

                                            <p className="mt-1 text-sm text-slate-600">
                                                {
                                                    product.location
                                                        ?.pickupAddress ??
                                                    "Not specified"
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Category
                                            </p>

                                            <p className="mt-1 text-sm text-slate-600">
                                                {
                                                    product.category?.name ??
                                                    "Not specified"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SCHEDULE */}
                            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                            📅
                                        </div>

                                        <div>
                                            <h2 className="text-base font-semibold text-slate-950">
                                                Rental schedule
                                            </h2>

                                            <p className="text-xs text-slate-500">
                                                Select your rental
                                                period
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                Start date
                                            </label>

                                            <input
                                                type="date"
                                                min={today}
                                                value={
                                                    startDate
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setStartDate(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                Rental duration
                                            </label>

                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={
                                                        minRentalDays
                                                    }
                                                    max={
                                                        maxRentalDays
                                                    }
                                                    value={
                                                        rentalDays
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setRentalDays(
                                                            Number(
                                                                event
                                                                    .target
                                                                    .value,
                                                            ),
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-16 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                                />

                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                                    days
                                                </span>
                                            </div>

                                            <p className="mt-2 text-xs text-slate-400">
                                                {minRentalDays}–
                                                {
                                                    maxRentalDays
                                                } days allowed
                                            </p>
                                        </div>
                                    </div>

                                    {calculatedEndDate && (
                                        <div className="mt-5 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
                                            <div>
                                                <p className="text-xs font-medium text-blue-600">
                                                    Expected return
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-blue-950">
                                                    {
                                                        calculatedEndDate
                                                    }
                                                </p>
                                            </div>

                                            <span className="text-blue-600">
                                                →
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* LOCATION */}
                            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 px-6 py-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                                ◉
                                            </div>

                                            <div>
                                                <h2 className="text-base font-semibold text-slate-950">
                                                    Delivery location
                                                </h2>

                                                <p className="text-xs text-slate-500">
                                                    Select where you
                                                    want delivery
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={
                                                handleUseCurrentLocation
                                            }
                                            disabled={
                                                locationLoading
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {locationLoading
                                                ? "Detecting..."
                                                : "⌖ Use my location"}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {locationError && (
                                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                            {
                                                locationError
                                            }
                                        </div>
                                    )}

                                    <div className="overflow-hidden rounded-xl border border-slate-200">
                                        <ProductMap
                                            latitude={
                                                deliveryLatitude
                                            }
                                            longitude={
                                                deliveryLongitude
                                            }
                                            onLocationChange={
                                                handleLocationChange
                                            }
                                        />
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Latitude
                                            </p>

                                            <p className="mt-1 break-all font-mono text-xs text-slate-700">
                                                {deliveryLatitude !==
                                                null
                                                    ? deliveryLatitude.toFixed(
                                                          7,
                                                      )
                                                    : "Not selected"}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Longitude
                                            </p>

                                            <p className="mt-1 break-all font-mono text-xs text-slate-700">
                                                {deliveryLongitude !==
                                                null
                                                    ? deliveryLongitude.toFixed(
                                                          7,
                                                      )
                                                    : "Not selected"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Delivery address
                                        </label>

                                        <textarea
                                            value={
                                                deliveryAddress
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setDeliveryAddress(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            rows={3}
                                            placeholder="Use your location or select a point on the map"
                                            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                        />

                                        <p className="mt-2 text-xs text-slate-400">
                                            Address is automatically
                                            detected when you select
                                            a location.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* CONTACT */}
                            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                            ☎
                                        </div>

                                        <div>
                                            <h2 className="text-base font-semibold text-slate-950">
                                                Contact information
                                            </h2>

                                            <p className="text-xs text-slate-500">
                                                Delivery contact
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Contact phone
                                    </label>

                                    <input
                                        type="tel"
                                        maxLength={20}
                                        value={
                                            contactPhone
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setContactPhone(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="01XXXXXXXXX"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                    />
                                </div>
                            </section>

                            {/* OFFER */}
                            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 px-6 py-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                                ৳
                                            </div>

                                            <div>
                                                <h2 className="text-base font-semibold text-slate-950">
                                                    Pricing & offer
                                                </h2>

                                                <p className="text-xs text-slate-500">
                                                    Set your preferred
                                                    rental rate
                                                </p>
                                            </div>
                                        </div>

                                        {product.negotiationAllowed && (
                                            <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                Negotiation available
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6">
                                    {product.negotiationAllowed ? (
                                        <>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                Offered price per day
                                                <span className="ml-2 text-xs font-normal text-slate-400">
                                                    Optional
                                                </span>
                                            </label>

                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                    ৳
                                                </span>

                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={
                                                        offeredPricePerDay
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setOfferedPricePerDay(
                                                            event
                                                                .target
                                                                .value ===
                                                                ""
                                                                ? ""
                                                                : Number(
                                                                      event
                                                                          .target
                                                                          .value,
                                                                  ),
                                                        )
                                                    }
                                                    placeholder={String(
                                                        listedPricePerDay,
                                                    )}
                                                    className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-9 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                                />
                                            </div>

                                            <p className="mt-2 text-xs text-slate-400">
                                                Leave empty to use the
                                                listed price.
                                            </p>
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                            <p className="text-sm text-slate-500">
                                                Negotiation is not
                                                available for this
                                                product.
                                            </p>

                                            <p className="mt-2 text-xl font-bold text-slate-950">
                                                ৳
                                                {listedPricePerDay.toLocaleString()}
                                                <span className="text-sm font-medium text-slate-500">
                                                    {" "}
                                                    / day
                                                </span>
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-5">
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="text-sm font-medium text-slate-700">
                                                Message
                                                <span className="ml-2 text-xs font-normal text-slate-400">
                                                    Optional
                                                </span>
                                            </label>

                                            <span className="text-xs text-slate-400">
                                                {
                                                    renterMessage.length
                                                }
                                                /1000
                                            </span>
                                        </div>

                                        <textarea
                                            rows={4}
                                            maxLength={1000}
                                            value={
                                                renterMessage
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setRenterMessage(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="Add a message for the product owner..."
                                            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ERROR */}
                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                    <div className="flex gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                                            !
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-red-900">
                                                Unable to submit
                                                request
                                            </p>

                                            <p className="mt-1 text-sm text-red-700">
                                                {error}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SUCCESS */}
                            {success && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="flex gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                                            ✓
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-emerald-900">
                                                Request submitted
                                            </p>

                                            <p className="mt-1 text-sm text-emerald-700">
                                                Redirecting to your
                                                rental request...
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* =================================
                            SUMMARY
                        ================================= */}

                        <aside className="lg:sticky lg:top-6 lg:self-start">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 bg-slate-950 px-6 py-6 text-white">
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                        Request summary
                                    </p>

                                    <h2 className="mt-2 text-xl font-semibold">
                                        Review & submit
                                    </h2>

                                    <p className="mt-2 text-sm leading-5 text-slate-400">
                                        Check your rental details
                                        before sending the request.
                                    </p>
                                </div>

                                <div className="space-y-5 p-6">

                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            Product
                                        </p>

                                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                                            {
                                                product.name
                                            }
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Start date
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {startDate ||
                                                    "Not selected"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Duration
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {
                                                    rentalDays
                                                }{" "}
                                                day
                                                {rentalDays !==
                                                1
                                                    ? "s"
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Delivery address
                                        </p>

                                        <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-700">
                                            {deliveryAddress ||
                                                "Not selected"}
                                        </p>
                                    </div>

                                    <div className="border-t border-slate-100 pt-5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">
                                                Price / day
                                            </span>

                                            <span className="font-semibold text-slate-900">
                                                ৳
                                                {effectivePricePerDay.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between text-sm">
                                            <span className="text-slate-500">
                                                Rental days
                                            </span>

                                            <span className="font-semibold text-slate-900">
                                                ×{" "}
                                                {
                                                    rentalDays
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                                        <p className="text-xs font-medium text-blue-600">
                                            Estimated rental amount
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-slate-950">
                                            ৳
                                            {estimatedRentalAmount.toLocaleString()}
                                        </p>

                                        <p className="mt-2 text-xs leading-5 text-slate-500">
                                            Final pricing may change
                                            through negotiation and
                                            approval.
                                        </p>
                                    </div>

                                    {product.securityDeposit &&
                                    Number(product.securityDeposit) > 0 && (
                                        <div
                                            className="rounded-xl border border-amber-100 bg-amber-50 p-5"
                                        >
                                            <p className="text-xs font-medium text-amber-600">
                                                Security deposit
                                            </p>

                                            <p className="mt-1 text-lg font-bold text-slate-950">
                                                ৳
                                                {
                                                    Number(
                                                        product.securityDeposit,
                                                    ).toLocaleString()
                                                }
                                            </p>

                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                Refundable deposit held
                                                until product is
                                                returned.
                                            </p>
                                        </div>
                                    )}

                                    <div className="border-t border-slate-100 pt-6 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    agreeToTerms
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setAgreeToTerms(
                                                        event
                                                            .target
                                                            .checked,
                                                    )
                                                }
                                                className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />

                                            <div className="text-sm leading-5 text-slate-600">
                                                I agree to the
                                                <span className="font-medium text-slate-900">
                                                    rental terms
                                                </span>{" "}
                                                and authorize the
                                                platform to
                                                process this
                                                rental request.
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={
                                                submitting ||
                                                !agreeToTerms
                                            }
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-white" />

                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    Submit rental
                                                    request

                                                    <span>
                                                        →
                                                    </span>
                                                </>
                                            )}
                                        </button>

                                    <p className="text-center text-[11px] leading-5 text-slate-400">
                                        Your request will be sent
                                        to the product owner for
                                        review.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                    </form>
                </div>
            </main>
        </>
    );
}