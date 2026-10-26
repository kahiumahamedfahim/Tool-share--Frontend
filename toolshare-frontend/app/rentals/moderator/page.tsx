"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";

import ModeratorNavbar from "@/app/components/moderator/ModeratorNavbar";
import {
    getModeratorRentalRequests,
    type PaginatedRentalRequests,
} from "@/app/lib/rental-api";

/* Helper - Price */
const formatPrice = (value: string | number) =>
    Number(value ?? 0).toFixed(2);

/* Helper - Date */
const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

export default function ModeratorRentalQueuePage() {
    const [page, setPage] =
        useState(1);

    const [meta, setMeta] = useState<
        PaginatedRentalRequests["meta"] | null
    >(null);

    const [requests, setRequests] = useState<
        PaginatedRentalRequests["data"]
    >([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /* =================================================
       LOAD QUEUE
    ================================================= */

    const loadQueue = async (targetPage: number) => {
        try {
            setLoading(true);
            setError("");

            const data =
                await getModeratorRentalRequests(
                    targetPage,
                );

            setRequests(data.data ?? []);
            setMeta(data.meta ?? null);
        } catch (
            err: unknown
        ) {
            console.error(
                "Failed to load moderator rental queue:",
                err,
            );

            let message =
                "Unable to load the rental review queue.";

            if (isAxiosError(err)) {
                const backendMessage =
                    err.response?.data?.message;

                message = Array.isArray(
                    backendMessage,
                )
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueue(page);
    }, [page]);

    /* =================================================
       RENDER
    ================================================= */

    return (
        <main className="min-h-screen bg-zinc-50">

            <ModeratorNavbar />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

                {/* Header */}

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

                    <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                        Rental Review Queue
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                        Requests with an agreed price wait
                        here for moderator review. Approving a
                        request confirms the booking for the
                        requested dates.
                    </p>

                </div>

                {/* Error */}

                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Content */}

                <div className="mt-6">

                    {loading ? (

                        <div className="grid gap-4">
                            {[0, 1, 2].map((index) => (
                                <div
                                    key={index}
                                    className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-white"
                                />
                            ))}
                        </div>

                    ) : requests.length === 0 ? (

                        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
                            <div className="text-3xl">
                                ✅
                            </div>

                            <h2 className="mt-3 text-lg font-semibold text-zinc-900">
                                Nothing to review
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                No price-agreed rental requests
                                are waiting for moderation.
                            </p>
                        </div>

                    ) : (

                        <div className="grid gap-4">

                            {requests.map(
                                (request) => (
                                    <Link
                                        key={
                                            request.rentalRequestId
                                        }
                                        href={`/rentals/moderator/${request.rentalRequestId}`}
                                        className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                    >

                                        <div className="flex flex-wrap items-start justify-between gap-3">

                                            <div>

                                                <p className="text-xs font-medium text-zinc-500">
                                                    {
                                                        request.rentalRequestId
                                                    }
                                                </p>

                                                <h3 className="mt-1 text-base font-semibold text-zinc-900">
                                                    {request
                                                        .product
                                                        ?.name ??
                                                        request.productId}
                                                </h3>

                                            </div>

                                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                Awaiting review
                                            </span>

                                        </div>

                                        <div className="mt-4 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2 lg:grid-cols-4">

                                            <div>
                                                <p className="text-xs font-medium text-zinc-400">
                                                    Renter
                                                </p>

                                                <p className="mt-0.5 truncate">
                                                    {request
                                                        .renter
                                                        ?.email ??
                                                        request.renterId}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-zinc-400">
                                                    Owner
                                                </p>

                                                <p className="mt-0.5 truncate">
                                                    {request
                                                        .owner
                                                        ?.email ??
                                                        request.ownerId}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-zinc-400">
                                                    Dates
                                                </p>

                                                <p className="mt-0.5">
                                                    {formatDate(
                                                        request.startDate,
                                                    )}{" "}
                                                    →{" "}
                                                    {formatDate(
                                                        request.endDate,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-zinc-400">
                                                    Agreed price
                                                </p>

                                                <p className="mt-0.5 font-semibold text-zinc-900">
                                                    ৳{
                                                        formatPrice(
                                                            request.agreedPricePerDay ??
                                                                request.offeredPricePerDay ??
                                                                request.listedPricePerDay,
                                                        )
                                                    }
                                                    /day
                                                </p>
                                            </div>

                                        </div>

                                    </Link>
                                ),
                            )}

                        </div>

                    )}

                </div>

                {/* Pagination */}

                {meta &&
                    !loading &&
                    requests.length > 0 && (
                        <div className="mt-6 flex items-center justify-between">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() =>
                                    setPage(
                                        page - 1,
                                    )
                                }
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                ← Previous
                            </button>

                            <p className="text-sm text-zinc-500">
                                Page{" "}
                                <span className="font-semibold text-zinc-900">
                                    {meta.page}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-zinc-900">
                                    {meta.totalPages}
                                </span>
                            </p>

                            <button
                                type="button"
                                disabled={
                                    page >= meta.totalPages
                                }
                                onClick={() =>
                                    setPage(
                                        page + 1,
                                    )
                                }
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next →
                            </button>
                        </div>
                    )}

            </div>

        </main>
    );
}
