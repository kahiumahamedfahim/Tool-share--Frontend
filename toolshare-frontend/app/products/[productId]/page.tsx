"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import ErrorMessage from "@/app/components/ErrorMessage";
import api from "@/app/lib/axios";

import { Product } from "../types/product";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000";

interface ProductOwner {
    userId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
}

interface ProductResponse {
    data: Product & {
        isOwner?: boolean;
        owner?: ProductOwner;
    };
}

type ProductDetails = Product & {
    isOwner?: boolean;
    owner?: ProductOwner;
};

function getFileUrl(path?: string): string {
    if (!path) {
        return "";
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return `${API_BASE_URL}/${path
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")}`;
}

function getFileName(path?: string): string {
    if (!path) {
        return "Document";
    }

    return path.split(/[\\/]/).pop() || "Document";
}

function formatPrice(value: unknown): string {
    const number = Number(value);

    if (Number.isNaN(number)) {
        return "0.00";
    }

    return number.toFixed(2);
}

function formatDate(value: string | null | undefined): string {
    if (!value) {
        return "—";
    }

    try {
        return new Date(value).toLocaleDateString("en-BD", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return value;
    }
}

/* -------------------------------------------------------------------------- */
/* Loading Skeleton                                                           */
/* -------------------------------------------------------------------------- */

function ProductDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-[#f7f8fa]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="animate-pulse">
                    <div className="mb-8 h-4 w-48 rounded bg-slate-200" />

                    <div className="mb-8">
                        <div className="h-4 w-24 rounded bg-slate-200" />
                        <div className="mt-4 h-10 w-2/3 rounded bg-slate-200" />
                        <div className="mt-3 h-4 w-48 rounded bg-slate-200" />
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
                        <div className="space-y-6">
                            <div className="h-[520px] rounded-3xl bg-slate-200" />

                            <div className="h-48 rounded-3xl bg-slate-200" />
                        </div>

                        <div className="h-[520px] rounded-3xl bg-slate-200" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Small UI Components                                                        */
/* -------------------------------------------------------------------------- */

function StatusBadge({
    status,
}: {
    status?: string;
}) {
    const available =
        status?.toUpperCase() === "AVAILABLE";

    return (
        <span
            className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
                "text-xs font-semibold",
                available
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700",
            ].join(" ")}
        >
            <span
                className={[
                    "h-1.5 w-1.5 rounded-full",
                    available ? "bg-emerald-500" : "bg-amber-500",
                ].join(" ")}
            />

            {status || "UNKNOWN"}
        </span>
    );
}

function InfoRow({
    label,
    value,
    valueClassName = "",
}: {
    label: string;
    value: React.ReactNode;
    valueClassName?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-6 border-b border-slate-100 py-4 last:border-b-0">
            <span className="text-sm text-slate-500">
                {label}
            </span>

            <span
                className={`text-right text-sm font-semibold text-slate-900 ${valueClassName}`}
            >
                {value}
            </span>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function ProductDetailsPage() {
    const params = useParams<{ productId: string }>();
    const router = useRouter();

    const productId = params.productId;

    const [product, setProduct] =
        useState<ProductDetails | null>(null);

    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    const [activeImageIndex, setActiveImageIndex] =
        useState(0);

    /* ---------------------------------------------------------------------- */
    /* Authentication                                                         */
    /* ---------------------------------------------------------------------- */

    const [currentUserId, setCurrentUserId] =
        useState<string | null>(null);

    const [authChecked, setAuthChecked] =
        useState(false);

    /* ---------------------------------------------------------------------- */
    /* Delete                                                                 */
    /* ---------------------------------------------------------------------- */

    const [showDeleteModal, setShowDeleteModal] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState("");

    /* ---------------------------------------------------------------------- */
    /* Load Current User                                                      */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        let mounted = true;

        const loadCurrentUser = async () => {
            try {
                const response = await api.get<{
                    userId: string;
                    role: string;
                }>("/auth/profile");

                if (!mounted) {
                    return;
                }

                if (response.data?.userId) {
                    setCurrentUserId(
                        response.data.userId,
                    );
                } else {
                    setCurrentUserId(null);
                }
            } catch (error) {
                if (!mounted) {
                    return;
                }

                console.log(
                    "No authenticated user found:",
                    error,
                );

                setCurrentUserId(null);
            } finally {
                if (mounted) {
                    setAuthChecked(true);
                }
            }
        };

        void loadCurrentUser();

        return () => {
            mounted = false;
        };
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Get Product                                                            */
    /* ---------------------------------------------------------------------- */

    const getProductDetails = useCallback(async () => {
        if (!productId) {
            return;
        }

        try {
            setLoading(true);
            setApiError("");

            const response =
                await api.get<ProductResponse>(
                    `/products/${encodeURIComponent(
                        productId,
                    )}`,
                );

            setProduct(response.data.data);
            setActiveImageIndex(0);
        } catch (error) {
            console.error(
                "Error fetching product details:",
                error,
            );

            const responseData =
                (
                    error as {
                        response?: {
                            data?: {
                                message?:
                                    | string
                                    | string[];
                            };
                        };
                    }
                ).response?.data;

            const message =
                responseData?.message;

            setApiError(
                Array.isArray(message)
                    ? message.join(", ")
                    : message ||
                          "Could not load product details.",
            );
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        void getProductDetails();
    }, [getProductDetails]);

    /* ---------------------------------------------------------------------- */
    /* Delete Product                                                        */
    /* ---------------------------------------------------------------------- */

    const handleDeleteProduct = async () => {
        if (!product) {
            return;
        }

        try {
            setDeleting(true);
            setDeleteError("");

            await api.delete(
                `/products/${encodeURIComponent(
                    product.productId,
                )}`,
            );

            setShowDeleteModal(false);

            router.push("/products/my-products");
        } catch (error) {
            console.error(
                "Failed to delete product:",
                error,
            );

            const responseData =
                (
                    error as {
                        response?: {
                            data?: {
                                message?:
                                    | string
                                    | string[];
                            };
                        };
                    }
                ).response?.data;

            const message =
                responseData?.message;

            setDeleteError(
                Array.isArray(message)
                    ? message.join(", ")
                    : message ||
                          "Failed to delete product.",
            );
        } finally {
            setDeleting(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Loading                                                                */
    /* ---------------------------------------------------------------------- */

    if (loading) {
        return (
            <>
                <RoleBasedNavbar />
                <ProductDetailsSkeleton />
            </>
        );
    }

    /* ---------------------------------------------------------------------- */
    /* Error                                                                  */
    /* ---------------------------------------------------------------------- */

    if (apiError || !product) {
        return (
            <>
                <RoleBasedNavbar />

                <main className="min-h-screen bg-[#f7f8fa] px-4 py-16">
                    <div className="mx-auto max-w-3xl">
                        <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                !
                            </div>

                            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
                                Unable to load product
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-red-600">
                                {apiError ||
                                    "Product not found."}
                            </p>

                            <Link
                                href="/products"
                                className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Back to products
                            </Link>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    /* ---------------------------------------------------------------------- */
    /* Derived Data                                                           */
    /* ---------------------------------------------------------------------- */

    const images = product.productImages ?? [];

    const safeImageIndex = Math.min(
        activeImageIndex,
        Math.max(images.length - 1, 0),
    );

    const activeImage =
        images[safeImageIndex];

    const isOwner =
        product.isOwner === true;

    const isLoggedIn =
        authChecked && !!currentUserId;

    const canRent =
        isLoggedIn && !isOwner;

    const availability =
        product.availabilityStatus?.toUpperCase() ===
        "AVAILABLE";

    const categoryName =
        product.category?.name ||
        "General";

    const ownerName =
        product.owner
            ? `${product.owner.firstName} ${product.owner.lastName}`
            : "Product Owner";

    const ownerInitials =
        product.owner
            ? `${product.owner.firstName?.charAt(0) || ""}${product.owner.lastName?.charAt(0) || ""}`.toUpperCase()
            : "U";

    /* ---------------------------------------------------------------------- */
    /* Render                                                                 */
    /* ---------------------------------------------------------------------- */

    return (
        <>
            <RoleBasedNavbar />

            <main className="min-h-screen bg-[#f7f8fa]">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                    {/* ====================================================== */}
                    {/* Breadcrumb                                             */}
                    {/* ====================================================== */}

                    <nav className="mb-8 flex items-center gap-2 text-sm">
                        <Link
                            href="/products"
                            className="font-medium text-slate-500 transition hover:text-slate-950"
                        >
                            Products
                        </Link>

                        <span className="text-slate-300">
                            /
                        </span>

                        <span className="truncate font-medium text-slate-900">
                            {product.name}
                        </span>
                    </nav>

                    {/* ====================================================== */}
                    {/* Header                                                  */}
                    {/* ====================================================== */}

                    <header className="mb-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                                        {categoryName}
                                    </span>

                                    <StatusBadge
                                        status={
                                            product.availabilityStatus
                                        }
                                    />
                                </div>

                                <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                                    {product.name}
                                </h1>

                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                                    <span>
                                        Product ID:{" "}
                                        <span className="font-medium text-slate-700">
                                            {
                                                product.productId
                                            }
                                        </span>
                                    </span>

                                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                                    <span>
                                        Listed by{" "}
                                        <span className="font-medium text-slate-700">
                                            {ownerName}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <Link
                                href="/products"
                                className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                ← Browse products
                            </Link>
                        </div>
                    </header>

                    {/* ====================================================== */}
                    {/* Main Product Area                                       */}
                    {/* ====================================================== */}

                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
                        {/* ================================================== */}
                        {/* LEFT COLUMN                                         */}
                        {/* ================================================== */}

                        <div className="min-w-0 space-y-8">
                            {/* Gallery */}

                            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
                                <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden bg-[#f1f3f5] sm:min-h-[520px]">
                                    {/* Decorative background */}
                                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.95),transparent_35%)]" />

                                    {activeImage ? (
                                        <img
                                            src={getFileUrl(
                                                activeImage.filePath,
                                            )}
                                            alt={`${product.name} - image ${
                                                safeImageIndex +
                                                1
                                            }`}
                                            className="relative z-10 max-h-[560px] w-full object-contain p-8 transition duration-500 sm:p-12"
                                        />
                                    ) : (
                                        <div className="relative z-10 px-6 text-center">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-2xl font-bold text-slate-400 shadow-sm">
                                                IMG
                                            </div>

                                            <p className="mt-5 text-sm font-medium text-slate-500">
                                                No product image
                                                available
                                            </p>
                                        </div>
                                    )}

                                    {images.length > 0 && (
                                        <div className="absolute bottom-5 right-5 z-20 rounded-full border border-white/70 bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                                            {safeImageIndex +
                                                1}{" "}
                                            /{" "}
                                            {images.length}
                                        </div>
                                    )}
                                </div>

                                {images.length > 1 && (
                                    <div className="border-t border-slate-100 bg-white p-4">
                                        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
                                            {images.map(
                                                (
                                                    image,
                                                    index,
                                                ) => {
                                                    const imageUrl =
                                                        getFileUrl(
                                                            image.filePath,
                                                        );

                                                    const active =
                                                        safeImageIndex ===
                                                        index;

                                                    return (
                                                        <button
                                                            key={
                                                                image.id ??
                                                                `${product.productId}-${index}`
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                setActiveImageIndex(
                                                                    index,
                                                                )
                                                            }
                                                            aria-label={`View image ${
                                                                index +
                                                                1
                                                            }`}
                                                            aria-pressed={
                                                                active
                                                            }
                                                            className={[
                                                                "group overflow-hidden rounded-2xl border-2 bg-slate-50 transition-all",
                                                                active
                                                                    ? "border-slate-950 shadow-sm"
                                                                    : "border-transparent hover:border-slate-300",
                                                            ].join(
                                                                " ",
                                                            )}
                                                        >
                                                            <img
                                                                src={
                                                                    imageUrl
                                                                }
                                                                alt={`${product.name} thumbnail ${
                                                                    index +
                                                                    1
                                                                }`}
                                                                className="h-20 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-24"
                                                                loading="lazy"
                                                            />
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* ================================================= */}
                            {/* Product Overview                                  */}
                            {/* ================================================= */}

                            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.04)] sm:p-8">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                        Product overview
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                                        Everything you need to know
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Review the product
                                        description, rental
                                        rules, and listing
                                        information before
                                        submitting a request.
                                    </p>
                                </div>

                                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-slate-50 p-5">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                            Rental duration
                                        </p>

                                        <p className="mt-2 text-lg font-bold text-slate-950">
                                            {
                                                product.minRentalDays
                                            }{" "}
                                            -{" "}
                                            {
                                                product.maxRentalDays
                                            }{" "}
                                            days
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Flexible rental period
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 p-5">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                            Negotiation
                                        </p>

                                        <p
                                            className={[
                                                "mt-2 text-lg font-bold",
                                                product.negotiationAllowed
                                                    ? "text-emerald-600"
                                                    : "text-slate-950",
                                            ].join(
                                                " ",
                                            )}
                                        >
                                            {product.negotiationAllowed
                                                ? "Allowed"
                                                : "Fixed price"}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Rental price policy
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 p-5">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                            Same-day rental
                                        </p>

                                        <p
                                            className={[
                                                "mt-2 text-lg font-bold",
                                                product.allowSameDayRental
                                                    ? "text-emerald-600"
                                                    : "text-slate-950",
                                            ].join(
                                                " ",
                                            )}
                                        >
                                            {product.allowSameDayRental
                                                ? "Available"
                                                : "Unavailable"}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Subject to rental availability
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 p-5">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                            Availability
                                        </p>

                                        <p
                                            className={[
                                                "mt-2 text-lg font-bold",
                                                availability
                                                    ? "text-emerald-600"
                                                    : "text-amber-600",
                                            ].join(
                                                " ",
                                            )}
                                        >
                                            {product.availabilityStatus}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Current listing status
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* ================================================= */}
                            {/* Rental Windows                                    */}
                            {/* ================================================= */}

                            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.04)] sm:p-8">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                        Scheduling
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                                        Rental Windows
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        When the product is available
                                        for pickup, rental, and
                                        return.
                                    </p>
                                </div>

                                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-2xl bg-slate-50 p-5">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                            Rental Window
                                        </p>

                                        <p className="mt-2 text-lg font-bold text-slate-950">
                                            {
                                                product.rentalWindowStart ||
                                                product.rentalWindowEnd ? (
                                                    <>
                                                        {formatDate(
                                                            product
                                                                .rentalWindowStart,
                                                        )}
                                                        {" to "}
                                                        {formatDate(
                                                            product
                                                                .rentalWindowEnd,
                                                        )}
                                                    </>
                                                ) : (
                                                    "Not set"
                                                )
                                            }
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Period when the product
                                            may be rented.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 p-5">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                            Delivery Window
                                        </p>

                                        <p className="mt-2 text-lg font-bold text-slate-950">
                                            {
                                                product.deliveryWindowStart ||
                                                product.deliveryWindowEnd ? (
                                                    <>
                                                        {formatDate(
                                                            product
                                                                .deliveryWindowStart,
                                                        )}
                                                        {" to "}
                                                        {formatDate(
                                                            product
                                                                .deliveryWindowEnd,
                                                        )}
                                                    </>
                                                ) : (
                                                    "Not set"
                                                )
                                            }
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Window when the owner
                                            hands the product
                                            to the rider.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 p-5">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                            Return Window
                                        </p>

                                        <p className="mt-2 text-lg font-bold text-slate-950">
                                            {
                                                product.returnWindowStart ||
                                                product.returnWindowEnd ? (
                                                    <>
                                                        {formatDate(
                                                            product
                                                                .returnWindowStart,
                                                        )}
                                                        {" to "}
                                                        {formatDate(
                                                            product
                                                                .returnWindowEnd,
                                                        )}
                                                    </>
                                                ) : (
                                                    "Not set"
                                                )
                                            }
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Window when the
                                            product must be back
                                            with the owner.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* ================================================= */}
                            {/* Description                                      */}
                            {/* ================================================= */}

                            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.04)] sm:p-8">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                    Description
                                </p>

                                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                                    About this product
                                </h2>

                                <div className="mt-6">
                                    <p className="whitespace-pre-line text-[15px] leading-8 text-slate-600">
                                        {product.description ||
                                            "No description has been provided for this product."}
                                    </p>
                                </div>
                            </section>

                            {/* ================================================= */}
                            {/* Owner                                             */}
                            {/* ================================================= */}

                            <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
                                <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                        Listed by
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                                        Product owner
                                    </h2>
                                </div>

                                <div className="p-6 sm:p-8">
                                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-slate-950 text-xl font-bold text-white shadow-lg">
                                            {ownerInitials}
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-xl font-bold text-slate-950">
                                                {ownerName}
                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">
                                                User ID:{" "}
                                                <span className="font-medium text-slate-700">
                                                    {product.owner
                                                        ?.userId ||
                                                        product.ownerId}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Email
                                            </p>

                                            <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                                                {product.owner
                                                    ?.email ||
                                                    "Not available"}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Phone
                                            </p>

                                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                                {product.owner
                                                    ?.phone ||
                                                    "Not available"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ================================================= */}
                            {/* Documents                                        */}
                            {/* ================================================= */}

                            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.04)] sm:p-8">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                        Verification
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                                        Product documents
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Supporting documents
                                        attached to this listing.
                                    </p>
                                </div>

                                {product.productDocuments?.length ? (
                                    <div className="mt-7 grid gap-4">
                                        {product.productDocuments.map(
                                            (
                                                document,
                                                index,
                                            ) => (
                                                <div
                                                    key={`${document.filePath}-${index}`}
                                                    className="group flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center"
                                                >
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xs font-black text-red-600">
                                                        PDF
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-slate-900">
                                                            Product document
                                                        </p>

                                                        <p className="mt-1 truncate text-sm text-slate-500">
                                                            {getFileName(
                                                                document.filePath,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <a
                                                        href={getFileUrl(
                                                            document.filePath,
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                                    >
                                                        View document
                                                    </a>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                                        <p className="font-semibold text-slate-900">
                                            No documents uploaded
                                        </p>

                                        <p className="mt-2 text-sm text-slate-500">
                                            No supporting documents
                                            are available for
                                            this listing.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* ================================================== */}
                        {/* RIGHT COLUMN - STICKY RENTAL CARD                  */}
                        {/* ================================================== */}

                        <aside className="lg:sticky lg:top-24">
                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                                {/* Price */}

                                <div className="p-6 sm:p-7">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                                Rental rate
                                            </p>

                                            <div className="mt-3 flex items-baseline gap-2">
                                                <span className="text-4xl font-black tracking-tight text-slate-950">
                                                    ৳
                                                    {formatPrice(
                                                        product.pricePerDay,
                                                    )}
                                                </span>

                                                <span className="text-sm font-medium text-slate-500">
                                                    / day
                                                </span>
                                            </div>
                                        </div>

                                        <StatusBadge
                                            status={
                                                product.availabilityStatus
                                            }
                                        />
                                    </div>

                                    {/* Rental Summary */}

                                    <div className="mt-7 rounded-2xl bg-slate-50 p-5">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                            Rental summary
                                        </p>

                                        <div className="mt-3">
                                            <InfoRow
                                                label="Duration"
                                                value={`${product.minRentalDays} - ${product.maxRentalDays} days`}
                                            />

                                            <InfoRow
                                                label="Same-day"
                                                value={
                                                    product.allowSameDayRental
                                                        ? "Available"
                                                        : "Unavailable"
                                                }
                                                valueClassName={
                                                    product.allowSameDayRental
                                                        ? "text-emerald-600"
                                                        : "text-slate-700"
                                                }
                                            />

                                            <InfoRow
                                                label="Negotiation"
                                                value={
                                                    product.negotiationAllowed
                                                        ? "Allowed"
                                                        : "Fixed price"
                                                }
                                                valueClassName={
                                                    product.negotiationAllowed
                                                        ? "text-emerald-600"
                                                        : "text-slate-700"
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}

                                    <div className="mt-6">
                                        {isOwner ? (
                                            <div>
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                                    <p className="text-sm font-bold text-slate-950">
                                                        You own this
                                                        listing
                                                    </p>

                                                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                                                        Manage the
                                                        product from
                                                        the actions
                                                        below.
                                                    </p>
                                                </div>

                                                <div className="mt-4 grid gap-3">
                                                    <Link
                                                        href={`/products/${product.productId}/edit`}
                                                        className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
                                                    >
                                                        Update product
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeleteError(
                                                                "",
                                                            );
                                                            setShowDeleteModal(
                                                                true,
                                                            );
                                                        }}
                                                        className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-5 py-3.5 text-sm font-bold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                                                    >
                                                        Delete product
                                                    </button>
                                                </div>
                                            </div>
                                        ) : canRent ? (
                                            <div>
                                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                                                    <p className="text-sm font-bold text-emerald-900">
                                                        Ready to rent?
                                                    </p>

                                                    <p className="mt-1.5 text-sm leading-6 text-emerald-800">
                                                        Select your
                                                        rental dates
                                                        and submit a
                                                        request.
                                                    </p>
                                                </div>

                                                <Link
                                                    href={`/products/${product.productId}/rent`}
                                                    className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
                                                >
                                                    Rent this product
                                                </Link>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                                                    <p className="text-sm font-bold text-amber-900">
                                                        Login required
                                                    </p>

                                                    <p className="mt-1.5 text-sm leading-6 text-amber-800">
                                                        Sign in to
                                                        submit a
                                                        rental
                                                        request.
                                                    </p>
                                                </div>

                                                <Link
                                                    href="/login"
                                                    className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white transition hover:bg-slate-800"
                                                >
                                                    Login to rent
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Trust */}

                                    <div className="mt-6 border-t border-slate-100 pt-6">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                                                ✓
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    Review before
                                                    confirming
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    Confirm rental
                                                    dates, pricing,
                                                    availability,
                                                    and terms before
                                                    submitting.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Product ID footer */}

                                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-7">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-medium text-slate-500">
                                            Product ID
                                        </span>

                                        <span className="truncate text-xs font-bold text-slate-700">
                                            {product.productId}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>

                    {/* ====================================================== */}
                    {/* Bottom Notice                                           */}
                    {/* ====================================================== */}

                    <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
                        <div className="flex gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white font-bold text-amber-700 shadow-sm">
                                !
                            </div>

                            <div>
                                <p className="font-bold text-amber-950">
                                    Before you rent
                                </p>

                                <p className="mt-1 text-sm leading-6 text-amber-900/80">
                                    Confirm the product details,
                                    rental duration, pricing, and
                                    availability before proceeding.
                                    Availability may change over time.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* ============================================================== */}
            {/* Delete Confirmation Modal                                      */}
            {/* ============================================================== */}

            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget &&
                            !deleting
                        ) {
                            setShowDeleteModal(false);
                            setDeleteError("");
                        }
                    }}
                >
                    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                        <div className="p-6 sm:p-7">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 font-black text-red-600">
                                !
                            </div>

                            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
                                Delete product?
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                You are about to permanently
                                delete{" "}
                                <span className="font-bold text-slate-900">
                                    {product.name}
                                </span>
                                . This action cannot be undone.
                            </p>

                            {deleteError && (
                                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                                    {deleteError}
                                </div>
                            )}

                            <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={() => {
                                        setShowDeleteModal(
                                            false,
                                        );
                                        setDeleteError("");
                                    }}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={
                                        handleDeleteProduct
                                    }
                                    className="rounded-2xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deleting
                                        ? "Deleting..."
                                        : "Yes, delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backend Error */}
            <ErrorMessage
                message={deleteError}
                show={
                    !!deleteError &&
                    !showDeleteModal
                }
                onClose={() =>
                    setDeleteError("")
                }
            />
        </>
    );
}