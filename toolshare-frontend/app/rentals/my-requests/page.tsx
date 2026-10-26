
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import {
    getMyRentalRequests,
    type RentalRequest,
} from "@/app/lib/rental-api";

/* =====================================================
   STATUS CONFIG
===================================================== */

const statusConfig: Record<
    RentalRequest["status"],
    {
        label: string;
        className: string;
        dot: string;
    }
> = {
    PENDING: {
        label: "Pending",
        className:
            "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
    },

    NEGOTIATING: {
        label: "Negotiating",
        className:
            "border-indigo-200 bg-indigo-50 text-indigo-700",
        dot: "bg-indigo-500",
    },

    PRICE_AGREED: {
        label: "Price Agreed",
        className:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
    },

    APPROVED: {
        label: "Approved",
        className:
            "border-blue-200 bg-blue-50 text-blue-700",
        dot: "bg-blue-500",
    },

    REJECTED: {
        label: "Rejected",
        className:
            "border-red-200 bg-red-50 text-red-700",
        dot: "bg-red-500",
    },

    EXPIRED: {
        label: "Expired",
        className:
            "border-slate-200 bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
    },
};

/* =====================================================
   HELPERS
===================================================== */

function formatDate(date: string) {
    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleDateString(
        "en-BD",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        },
    );
}

function formatPrice(value?: string) {
    if (!value) {
        return "—";
    }

    return Number(value).toLocaleString(
        "en-BD",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        },
    );
}

/* =====================================================
   PAGE
===================================================== */

export default function MyRentalRequestsPage() {
    const router = useRouter();

    const [requests, setRequests] =
        useState<RentalRequest[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [totalPages, setTotalPages] =
        useState(1);

    const [totalRequests, setTotalRequests] =
        useState(0);

    const [statusFilter, setStatusFilter] =
        useState<"ALL" | RentalRequest["status"]>(
            "ALL",
        );

    /* =================================================
       FETCH
    ================================================= */

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getMyRentalRequests(
                        page,
                        10,
                    );

                setRequests(
                    response.data ?? [],
                );

                setTotalPages(
                    response.meta?.totalPages ?? 1,
                );

                setTotalRequests(
                    response.meta?.total ?? 0,
                );
            } catch (err: any) {
                console.error(
                    "Failed to fetch rental requests:",
                    err,
                );

                setError(
                    err?.response?.data?.message ||
                        "Unable to load your rental requests.",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [page]);

    /* =================================================
       FILTER
    ================================================= */

    const filteredRequests =
        statusFilter === "ALL"
            ? requests
            : requests.filter(
                  (request) =>
                      request.status ===
                      statusFilter,
              );

    /* =================================================
       LOADING
    ================================================= */

    if (loading) {
        return (
            <>
                <RoleBasedNavbar />

                <main className="min-h-screen bg-slate-50">
                    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
                        <div className="animate-pulse space-y-6">
                            <div className="h-10 w-64 rounded-lg bg-slate-200" />

                            <div className="h-24 rounded-2xl bg-slate-200" />

                            <div className="grid gap-5 lg:grid-cols-2">
                                <div className="h-72 rounded-2xl bg-slate-200" />
                                <div className="h-72 rounded-2xl bg-slate-200" />
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
                    HEADER
                ====================================== */}

                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">

                        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />

                                    Rental Activity
                                </div>

                                <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                                    My rental requests
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                                    Track your rental requests,
                                    negotiations, approvals and
                                    responses in one place.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/products",
                                    )
                                }
                                className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                                <span className="text-lg">
                                    +
                                </span>

                                Browse products
                            </button>
                        </div>

                    </div>
                </section>

                {/* ======================================
                    CONTENT
                ====================================== */}

                <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">

                    {/* ==================================
                        ERROR
                    ================================== */}

                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                                    !
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-red-900">
                                        Something went wrong
                                    </p>

                                    <p className="mt-1 text-sm text-red-700">
                                        {error}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            window.location.reload()
                                        }
                                        className="mt-3 text-sm font-semibold text-red-800 underline underline-offset-4"
                                    >
                                        Try again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================================
                        STATS
                    ================================== */}

                    <div className="mb-6 grid gap-4 sm:grid-cols-3">

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Total requests
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-950">
                                {totalRequests}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                All rental requests
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Current page
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-950">
                                {requests.length}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Requests shown
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Page
                            </p>

                            <p className="mt-2 text-3xl font-bold text-slate-950">
                                {page}
                                <span className="text-lg text-slate-400">
                                    {" "}
                                    / {totalPages}
                                </span>
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Request navigation
                            </p>
                        </div>

                    </div>

                    {/* ==================================
                        FILTER
                    ================================== */}

                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>
                                <h2 className="text-sm font-semibold text-slate-950">
                                    Rental requests
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Filter your requests by
                                    current status.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">

                                {[
                                    "ALL",
                                    "PENDING",
                                    "NEGOTIATING",
                                    "PRICE_AGREED",
                                    "APPROVED",
                                    "REJECTED",
                                    "EXPIRED",
                                ].map((status) => {
                                    const active =
                                        statusFilter ===
                                        status;

                                    return (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() =>
                                                setStatusFilter(
                                                    status as
                                                        | "ALL"
                                                        | RentalRequest["status"],
                                                )
                                            }
                                            className={
                                                active
                                                    ? "rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                                                    : "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                            }
                                        >
                                            {status ===
                                            "ALL"
                                                ? "All"
                                                : status
                                                      .replace(
                                                          /_/g,
                                                          " ",
                                                      )
                                                      .replace(
                                                          /\b\w/g,
                                                          (
                                                              letter,
                                                          ) =>
                                                              letter.toUpperCase(),
                                                      )}
                                        </button>
                                    );
                                })}

                            </div>
                        </div>
                    </div>

                    {/* ==================================
                        EMPTY
                    ================================== */}

                    {filteredRequests.length ===
                        0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">
                                ▦
                            </div>

                            <h2 className="mt-5 text-xl font-semibold text-slate-950">
                                {requests.length ===
                                0
                                    ? "No rental requests yet"
                                    : "No matching requests"}
                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                {requests.length ===
                                0
                                    ? "When you request a product for rent, your rental activity will appear here."
                                    : "Try selecting another status to see your rental requests."}
                            </p>

                            {requests.length ===
                                0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            "/products",
                                        )
                                    }
                                    className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                >
                                    Browse products
                                </button>
                            )}
                        </div>
                    )}

                    {/* ==================================
                        REQUEST GRID
                    ================================== */}

                    {filteredRequests.length >
                        0 && (
                        <div className="grid gap-5 lg:grid-cols-2">

                            {filteredRequests.map(
                                (request) => {
                                    const status =
                                        statusConfig[
                                            request.status
                                        ];

                                    const price =
                                        request.agreedPricePerDay ??
                                        request.offeredPricePerDay ??
                                        request.listedPricePerDay;

                                    return (
                                        <article
                                            key={
                                                request.rentalRequestId
                                            }
                                            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                                        >
                                            {/* CARD HEADER */}

                                            <div className="border-b border-slate-100 p-5">

                                                <div className="flex items-start justify-between gap-4">

                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                            {
                                                                request.rentalRequestId
                                                            }
                                                        </p>

                                                        <h2 className="mt-2 truncate text-lg font-semibold text-slate-950">
                                                            Product{" "}
                                                            {
                                                                request.productId
                                                            }
                                                        </h2>
                                                    </div>

                                                    <span
                                                        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                                        />

                                                        {
                                                            status.label
                                                        }
                                                    </span>
                                                </div>

                                            </div>

                                            {/* CARD BODY */}

                                            <div className="p-5">

                                                <div className="grid grid-cols-2 gap-x-5 gap-y-5">

                                                    <div>
                                                        <p className="text-xs text-slate-400">
                                                            Start date
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                                            {formatDate(
                                                                request.startDate,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-400">
                                                            End date
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                                            {formatDate(
                                                                request.endDate,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-400">
                                                            Duration
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                                            {
                                                                request.rentalDays
                                                            }{" "}
                                                            day
                                                            {request.rentalDays !==
                                                            1
                                                                ? "s"
                                                                : ""}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-400">
                                                            Price / day
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                                            ৳
                                                            {formatPrice(
                                                                price,
                                                            )}
                                                        </p>
                                                    </div>

                                                </div>

                                                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                                                    <div className="flex items-start justify-between gap-4">

                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-slate-400">
                                                                Delivery
                                                                location
                                                            </p>

                                                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-700">
                                                                {
                                                                    request.deliveryAddress
                                                                }
                                                            </p>
                                                        </div>

                                                        <span className="shrink-0 text-slate-400">
                                                            ◉
                                                        </span>
                                                    </div>

                                                </div>

                                                {request.renterMessage && (
                                                    <div className="mt-4">
                                                        <p className="text-xs font-medium text-slate-400">
                                                            Your message
                                                        </p>

                                                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                                                            {
                                                                request.renterMessage
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                            </div>

                                            {/* CARD FOOTER */}

                                            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-4">

                                                <div>
                                                    <p className="text-[11px] text-slate-400">
                                                        Submitted
                                                    </p>

                                                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                                                        {formatDate(
                                                            request.createdAt,
                                                        )}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.push(
                                                            `/rentals/request/${request.rentalRequestId}`,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                >
                                                    View details

                                                    <span>
                                                        →
                                                    </span>
                                                </button>

                                            </div>
                                        </article>
                                    );
                                },
                            )}

                        </div>
                    )}

                    {/* ==================================
                        PAGINATION
                    ================================== */}

                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

                            <p className="text-xs text-slate-500">
                                Page{" "}
                                <span className="font-semibold text-slate-800">
                                    {page}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-800">
                                    {totalPages}
                                </span>
                            </p>

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    disabled={
                                        page <= 1
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                Math.max(
                                                    1,
                                                    current -
                                                        1,
                                                ),
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    ← Previous
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        page >=
                                        totalPages
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                Math.min(
                                                    totalPages,
                                                    current +
                                                        1,
                                                ),
                                        )
                                    }
                                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next →
                                </button>

                            </div>
                        </div>
                    )}

                </div>
            </main>
        </>
    );
}