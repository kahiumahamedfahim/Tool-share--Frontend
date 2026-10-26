"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import {
    getOwnerRentalRequests,
    updateRentalRequestStatus,
    type RentalRequest,
} from "@/app/lib/rental-api";

type FilterStatus =
    | "ALL"
    | "PENDING"
    | "NEGOTIATING"
    | "PRICE_AGREED"
    | "APPROVED"
    | "REJECTED"
    | "EXPIRED";

const STATUS_CONFIG = {
    PENDING: {
        label: "Pending review",
        className:
            "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
    },

    NEGOTIATING: {
        label: "Negotiating",
        className:
            "border-violet-200 bg-violet-50 text-violet-700",
        dot: "bg-violet-500",
    },

    PRICE_AGREED: {
        label: "Price agreed",
        className:
            "border-blue-200 bg-blue-50 text-blue-700",
        dot: "bg-blue-500",
    },

    APPROVED: {
        label: "Approved",
        className:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
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
} as const;

function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}

function formatShortDate(date: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
    }).format(new Date(date));
}

function formatPrice(value?: string) {
    if (!value) return "—";

    const number = Number(value);

    if (Number.isNaN(number)) {
        return `৳${value}`;
    }

    return `৳${number.toLocaleString("en-BD")}`;
}

function getStatusConfig(status: RentalRequest["status"]) {
    return (
        STATUS_CONFIG[status] ?? {
            label: status,
            className:
                "border-slate-200 bg-slate-100 text-slate-600",
            dot: "bg-slate-400",
        }
    );
}

function StatCard({
    label,
    value,
    description,
    active,
    onClick,
}: {
    label: string;
    value: number;
    description: string;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group rounded-2xl border bg-white p-5 text-left transition-all duration-200 ${
                active
                    ? "border-indigo-200 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
            }`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                        {value}
                    </p>
                </div>

                <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        active
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-slate-50 text-slate-500"
                    }`}
                >
                    {label === "Total" && "◫"}
                    {label === "Pending" && "◷"}
                    {label === "Negotiating" && "↔"}
                    {label === "Approved" && "✓"}
                </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
                {description}
            </p>
        </button>
    );
}

function RequestCard({
    request,
    processingId,
    onAction,
    onView,
    onNegotiate,
}: {
    request: RentalRequest;
    processingId: string | null;
    onAction: (
        requestId: string,
        action: "ACCEPT" | "REJECT",
    ) => void;
    onView: (requestId: string) => void;
    onNegotiate: (requestId: string) => void;
}) {
    const status = getStatusConfig(request.status);

    const canRespond =
        request.status === "PENDING";

    const canNegotiate =
        request.status === "PENDING" ||
        request.status === "NEGOTIATING";

    const isProcessing =
        processingId === request.rentalRequestId;

    return (
        <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50">
            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />

            <div className="p-6 sm:p-7">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white shadow-sm">
                            {request.productId
                                .slice(-2)
                                .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Rental request
                            </p>

                            <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-950">
                                {request.rentalRequestId}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Product{" "}
                                <span className="font-medium text-slate-700">
                                    {request.productId}
                                </span>
                            </p>
                        </div>
                    </div>

                    <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                        />

                        {status.label}
                    </span>
                </div>

                {/* Divider */}
                <div className="my-6 h-px bg-slate-100" />

                {/* Main information grid */}
                <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                    <div>
                        {/* Renter */}
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Requested by
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                                    {request.renterId
                                        .slice(-2)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {request.renterId}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        Renter
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rental period */}
                        <div className="mt-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Rental period
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {formatShortDate(
                                            request.startDate,
                                        )}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Start
                                    </p>
                                </div>

                                <div className="flex flex-1 items-center gap-2">
                                    <div className="h-px flex-1 bg-slate-200" />

                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                                        {request.rentalDays}{" "}
                                        {request.rentalDays === 1
                                            ? "day"
                                            : "days"}
                                    </span>

                                    <div className="h-px flex-1 bg-slate-200" />
                                </div>

                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {formatShortDate(
                                            request.endDate,
                                        )}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        End
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div className="mt-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Delivery location
                            </p>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                {request.deliveryAddress}
                            </p>
                        </div>
                    </div>

                    {/* Pricing panel */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:min-w-[250px]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Pricing
                        </p>

                        <div className="mt-5">
                            <p className="text-xs text-slate-500">
                                Listed price
                            </p>

                            <p className="mt-1 text-lg font-semibold text-slate-900">
                                {formatPrice(
                                    request.listedPricePerDay,
                                )}

                                <span className="ml-1 text-xs font-normal text-slate-500">
                                    / day
                                </span>
                            </p>
                        </div>

                        <div className="my-4 border-t border-slate-200" />

                        <div>
                            <p className="text-xs text-slate-500">
                                Renter's offer
                            </p>

                            <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-600">
                                {formatPrice(
                                    request.offeredPricePerDay ??
                                        request.listedPricePerDay,
                                )}

                                <span className="ml-1 text-xs font-normal text-slate-500">
                                    / day
                                </span>
                            </p>
                        </div>

                        {request.offeredPricePerDay &&
                            request.listedPricePerDay && (
                                <div className="mt-4 rounded-xl bg-white px-3 py-2.5">
                                    <p className="text-xs text-slate-500">
                                        Difference
                                    </p>

                                    <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                        {formatPrice(
                                            String(
                                                Number(
                                                    request.listedPricePerDay,
                                                ) -
                                                    Number(
                                                        request.offeredPricePerDay,
                                                    ),
                                            ),
                                        )}{" "}
                                        / day
                                    </p>
                                </div>
                            )}

                        {request.agreedPricePerDay && (
                            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                                <p className="text-xs text-emerald-600">
                                    Agreed price
                                </p>

                                <p className="mt-0.5 text-sm font-bold text-emerald-700">
                                    {formatPrice(
                                        request.agreedPricePerDay,
                                    )}{" "}
                                    / day
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Negotiation hint */}
                {request.status === "NEGOTIATING" && (
                    <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                                ↔
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-violet-900">
                                    Negotiation in progress
                                </p>

                                <p className="mt-1 text-sm leading-6 text-violet-700">
                                    Review the offer history and continue
                                    the negotiation with the renter.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Message */}
                {request.renterMessage && (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Message from renter
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            “{request.renterMessage}”
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs text-slate-400">
                            Submitted{" "}
                            {formatDate(request.createdAt)}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        {/* View */}
                        <button
                            type="button"
                            onClick={() =>
                                onView(
                                    request.rentalRequestId,
                                )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            View request
                        </button>

                        {/* Pending actions */}
                        {canRespond && (
                            <>
                                <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() =>
                                        onAction(
                                            request.rentalRequestId,
                                            "REJECT",
                                        )
                                    }
                                    className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isProcessing
                                        ? "Processing..."
                                        : "Reject"}
                                </button>

                                <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() =>
                                        onAction(
                                            request.rentalRequestId,
                                            "ACCEPT",
                                        )
                                    }
                                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isProcessing
                                        ? "Processing..."
                                        : "Accept request"}
                                </button>
                            </>
                        )}

                        {/* Negotiation */}
                        {canNegotiate && (
                            <button
                                type="button"
                                onClick={() =>
                                    onNegotiate(
                                        request.rentalRequestId,
                                    )
                                }
                                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                            >
                                {request.status === "NEGOTIATING"
                                    ? "Continue negotiation"
                                    : "Negotiate"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

function LoadingCard() {
    return (
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-7">
            <div className="flex justify-between">
                <div className="flex gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100" />

                    <div>
                        <div className="h-3 w-24 rounded bg-slate-100" />

                        <div className="mt-3 h-5 w-40 rounded bg-slate-100" />

                        <div className="mt-2 h-3 w-28 rounded bg-slate-100" />
                    </div>
                </div>

                <div className="h-7 w-24 rounded-full bg-slate-100" />
            </div>

            <div className="my-6 h-px bg-slate-100" />

            <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
                <div>
                    <div className="h-3 w-24 rounded bg-slate-100" />

                    <div className="mt-3 h-10 w-48 rounded bg-slate-100" />

                    <div className="mt-8 h-3 w-24 rounded bg-slate-100" />

                    <div className="mt-3 h-8 w-full rounded bg-slate-100" />
                </div>

                <div className="h-48 rounded-2xl bg-slate-100" />
            </div>
        </div>
    );
}

export default function OwnerRentalRequestsPage() {
    const router = useRouter();

    const [requests, setRequests] = useState<RentalRequest[]>(
        [],
    );

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [processingId, setProcessingId] = useState<
        string | null
    >(null);

    const [filter, setFilter] =
        useState<FilterStatus>("ALL");

    const [page, setPage] = useState(1);

    const [totalPages, setTotalPages] = useState(1);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await getOwnerRentalRequests(page, 10);

            setRequests(response.data);
            setTotalPages(response.meta.totalPages);
        } catch (err: any) {
            console.error(
                "Failed to load owner rental requests:",
                err,
            );

            setError(
                err?.response?.data?.message ||
                    "Unable to load rental requests.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, [page]);

    const filteredRequests = useMemo(() => {
        if (filter === "ALL") {
            return requests;
        }

        return requests.filter(
            (request) => request.status === filter,
        );
    }, [requests, filter]);

    const stats = useMemo(() => {
        return {
            total: requests.length,

            pending: requests.filter(
                (item) => item.status === "PENDING",
            ).length,

            negotiating: requests.filter(
                (item) => item.status === "NEGOTIATING",
            ).length,

            approved: requests.filter(
                (item) => item.status === "APPROVED",
            ).length,
        };
    }, [requests]);

    const handleAction = async (
        rentalRequestId: string,
        action: "ACCEPT" | "REJECT",
    ) => {
        const confirmed = window.confirm(
            action === "ACCEPT"
                ? "Accept this rental request?"
                : "Reject this rental request?",
        );

        if (!confirmed) return;

        try {
            setProcessingId(rentalRequestId);
            setError("");

            await updateRentalRequestStatus(
                rentalRequestId,
                action,
            );

            await loadRequests();
        } catch (err: any) {
            console.error(
                "Rental request action failed:",
                err,
            );

            setError(
                err?.response?.data?.message ||
                    "Unable to update this rental request.",
            );
        } finally {
            setProcessingId(null);
        }
    };

    const handleView = (rentalRequestId: string) => {
        router.push(
            `/rentals/request/${rentalRequestId}`,
        );
    };

    const handleNegotiate = (
        rentalRequestId: string,
    ) => {
        router.push(
            `/rentals/request/${rentalRequestId}`,
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-950">
            <RoleBasedNavbar />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
                {/* Page heading */}
                <section className="mb-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

                                Owner workspace
                            </div>

                            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                                Rental requests
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                                Review incoming requests, compare
                                offers, negotiate with renters,
                                and decide who can rent your
                                products.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Current page
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {filteredRequests.length}{" "}
                                request
                                {filteredRequests.length !== 1
                                    ? "s"
                                    : ""}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total"
                        value={stats.total}
                        description="Requests on this page"
                        active={filter === "ALL"}
                        onClick={() => {
                            setFilter("ALL");
                            setPage(1);
                        }}
                    />

                    <StatCard
                        label="Pending"
                        value={stats.pending}
                        description="Waiting for your response"
                        active={filter === "PENDING"}
                        onClick={() => {
                            setFilter("PENDING");
                            setPage(1);
                        }}
                    />

                    <StatCard
                        label="Negotiating"
                        value={stats.negotiating}
                        description="Requests with active offers"
                        active={filter === "NEGOTIATING"}
                        onClick={() => {
                            setFilter("NEGOTIATING");
                            setPage(1);
                        }}
                    />

                    <StatCard
                        label="Approved"
                        value={stats.approved}
                        description="Requests approved by moderator"
                        active={filter === "APPROVED"}
                        onClick={() => {
                            setFilter("APPROVED");
                            setPage(1);
                        }}
                    />
                </section>

                {/* Toolbar */}
                <section className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                            Incoming requests
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Review each request before making a
                            decision or starting a negotiation.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {(
                            [
                                ["ALL", "All"],
                                ["PENDING", "Pending"],
                                ["NEGOTIATING", "Negotiating"],
                                ["PRICE_AGREED", "Price agreed"],
                                ["APPROVED", "Approved"],
                                ["REJECTED", "Rejected"],
                                ["EXPIRED", "Expired"],
                            ] as [FilterStatus, string][]
                        ).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => {
                                    setFilter(value);
                                    setPage(1);
                                }}
                                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                    filter === value
                                        ? "bg-slate-950 text-white"
                                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <div className="flex items-start justify-between gap-4">
                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={loadRequests}
                                className="shrink-0 font-semibold underline underline-offset-2"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="space-y-5">
                        <LoadingCard />
                        <LoadingCard />
                    </div>
                )}

                {/* Empty */}
                {!loading &&
                    filteredRequests.length === 0 && (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">
                                ◫
                            </div>

                            <h3 className="mt-5 text-lg font-semibold text-slate-900">
                                No rental requests found
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                {filter === "ALL"
                                    ? "When someone requests one of your products, their rental request will appear here."
                                    : "There are currently no requests matching this status."}
                            </p>

                            {filter !== "ALL" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFilter("ALL")
                                    }
                                    className="mt-6 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
                                >
                                    View all requests
                                </button>
                            )}
                        </div>
                    )}

                {/* Requests */}
                {!loading &&
                    filteredRequests.length > 0 && (
                        <div className="space-y-5">
                            {filteredRequests.map(
                                (request) => (
                                    <RequestCard
                                        key={
                                            request.rentalRequestId
                                        }
                                        request={request}
                                        processingId={
                                            processingId
                                        }
                                        onAction={
                                            handleAction
                                        }
                                        onView={handleView}
                                        onNegotiate={
                                            handleNegotiate
                                        }
                                    />
                                ),
                            )}
                        </div>
                    )}

                {/* Pagination */}
                {!loading &&
                    totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
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

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={page === 1}
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                current - 1,
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        page === totalPages
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                current + 1,
                                        )
                                    }
                                    className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
            </main>
        </div>
    );
}