"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import api from "@/app/lib/axios";
import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";

interface RentalProduct {
    productId: string;
    name: string;
    description?: string;
    pricePerDay: number | string;
}

interface RentalUser {
    userId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
}

interface RentalRequest {
    id: string;
    rentalRequestId: string;

    productId: string;

    renterId: string;
    ownerId: string;

    startDate: string;
    rentalDays: number;
    endDate: string;

    pickupAddress: string;

    deliveryLatitude?: string | number;
    deliveryLongitude?: string | number;
    deliveryAddress: string;

    contactPhone: string;

    renterMessage?: string;

    listedPricePerDay: string | number;
    offeredPricePerDay?: string | number | null;
    agreedPricePerDay?: string | number | null;

    status: string;

    moderatorId?: string | null;
    reviewedAt?: string | null;

    createdAt: string;
    updatedAt: string;

    product?: RentalProduct;
    renter?: RentalUser;
    owner?: RentalUser;
    moderator?: RentalUser;
}

interface RentalRequestResponse {
    data: RentalRequest;
}

const formatStatus = (status: string) => {
    return status
        .replace(/\_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusClasses = (status: string) => {
    switch (status) {
        case "PENDING":
            return "bg-yellow-100 text-yellow-700 border-yellow-200";

        case "NEGOTIATING":
            return "bg-blue-100 text-blue-700 border-blue-200";

        case "PRICE_AGREED":
            return "bg-purple-100 text-purple-700 border-purple-200";

        case "APPROVED":
            return "bg-green-100 text-green-700 border-green-200";

        case "REJECTED":
            return "bg-red-100 text-red-700 border-red-200";

        case "EXPIRED":
            return "bg-gray-100 text-gray-600 border-gray-200";

        default:
            return "bg-gray-100 text-gray-600 border-gray-200";
    }
};

const formatDate = (date?: string | null) => {
    if (!date) {
        return "N/A";
    }

    return new Date(date).toLocaleDateString("en-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const formatDateTime = (date?: string | null) => {
    if (!date) {
        return "N/A";
    }

    return new Date(date).toLocaleString("en-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const getUserName = (user?: RentalUser) => {
    if (!user) {
        return "N/A";
    }

    const fullName = `${user.firstName || ""} ${
        user.lastName || ""
    }`.trim();

    return fullName || user.userId;
};

export default function RentalRequestDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const rentalRequestId = params.rentalRequestId as string;

    const [request, setRequest] =
        useState<RentalRequest | null>(null);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");

    const [currentUserId, setCurrentUserId] = useState("");
    const [currentUserRole, setCurrentUserRole] = useState("");

    /*
     * Get logged-in user's information.
     */
    useEffect(() => {
        try {
            const storedUser =
                localStorage.getItem("user");

            if (!storedUser) {
                return;
            }

            const user = JSON.parse(storedUser);

            if (user?.userId) {
                setCurrentUserId(user.userId);
            }

            if (user?.role) {
                setCurrentUserRole(user.role);
            }
        } catch (err) {
            console.error(
                "Failed to read logged-in user:",
                err,
            );
        }
    }, []);

    /*
     * Fetch rental request.
     */
    const fetchRentalRequest = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await api.get<RentalRequestResponse>(
                    `/rental/request/${encodeURIComponent(
                        rentalRequestId,
                    )}`,
                );

            setRequest(response.data.data);
        } catch (err: any) {
            console.error(
                "Failed to fetch rental request:",
                err,
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to load rental request.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (rentalRequestId) {
            fetchRentalRequest();
        }
    }, [rentalRequestId]);

    /*
     * Determine whether the logged-in user is the owner.
     */
    const isOwner =
        !!currentUserId &&
        !!request &&
        request.ownerId === currentUserId;

    /*
     * Determine whether the logged-in user is the renter.
     */
    const isRenter =
        !!currentUserId &&
        !!request &&
        request.renterId === currentUserId;

    /*
     * Determine whether the logged-in user is a moderator/admin.
     */
    const isModerator =
        currentUserRole === "MODERATOR" ||
        currentUserRole === "ADMIN";

    /*
     * Renter can open negotiation while request
     * is still active.
     */
    const canNegotiate =
        isRenter &&
        (request?.status === "PENDING" ||
            request?.status === "NEGOTIATING");

    /*
     * Owner can take action only while request
     * is PENDING or NEGOTIATING.
     */
    const canOwnerTakeAction =
        isOwner &&
        (request?.status === "PENDING" ||
            request?.status === "NEGOTIATING");

    /*
     * Moderator can review only PRICE_AGREED requests.
     */
    const canModeratorReview =
        isModerator &&
        request?.status === "PRICE_AGREED";

    /*
     * Owner accepts the request.
     *
     * IMPORTANT:
     * Backend now expects:
     *
     * {
     *     action: "ACCEPT"
     * }
     *
     * Backend will change:
     *
     * PENDING / NEGOTIATING
     *        ↓
     * PRICE_AGREED
     */
    const handleAcceptRequest = async () => {
        if (!request || !canOwnerTakeAction) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to accept this rental request?",
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            setActionError("");

            await api.patch(
                `/rental/request/${encodeURIComponent(
                    request.rentalRequestId,
                )}/status`,
                {
                    action: "ACCEPT",
                },
            );

            await fetchRentalRequest();
        } catch (err: any) {
            console.error(
                "Failed to accept rental request:",
                err,
            );

            setActionError(
                err?.response?.data?.message ||
                    "Failed to accept rental request.",
            );
        } finally {
            setActionLoading(false);
        }
    };

    /*
     * Owner rejects the request.
     *
     * Backend expects:
     *
     * {
     *     action: "REJECT"
     * }
     */
    const handleRejectRequest = async () => {
        if (!request || !canOwnerTakeAction) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to reject this rental request?",
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            setActionError("");

            await api.patch(
                `/rental/request/${encodeURIComponent(
                    request.rentalRequestId,
                )}/status`,
                {
                    action: "REJECT",
                },
            );

            await fetchRentalRequest();
        } catch (err: any) {
            console.error(
                "Failed to reject rental request:",
                err,
            );

            setActionError(
                err?.response?.data?.message ||
                    "Failed to reject rental request.",
            );
        } finally {
            setActionLoading(false);
        }
    };

    /*
     * Moderator approves or rejects the rental request.
     *
     * Backend expects:
     *
     * {
     *     action: "APPROVE"
     * }
     *
     * or
     *
     * {
     *     action: "REJECT"
     * }
     */
    const handleModeratorReview = async (
        action: "APPROVE" | "REJECT",
    ) => {
        if (!request || !canModeratorReview) {
            return;
        }

        const confirmed = window.confirm(
            action === "APPROVE"
                ? "Are you sure you want to approve this rental request?"
                : "Are you sure you want to reject this rental request?",
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            setActionError("");

            await api.patch(
                `/rental/moderator/request/${encodeURIComponent(
                    request.rentalRequestId,
                )}/review`,
                {
                    action,
                },
            );

            await fetchRentalRequest();
        } catch (err: any) {
            console.error(
                "Failed to review rental request:",
                err,
            );

            setActionError(
                err?.response?.data?.message ||
                    "Failed to review rental request.",
            );
        } finally {
            setActionLoading(false);
        }
    };

    /*
     * Loading state.
     */
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <RoleBasedNavbar />

                <main className="mx-auto max-w-5xl px-6 py-10">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-72 rounded bg-gray-200" />

                        <div className="h-32 rounded-2xl bg-gray-200" />

                        <div className="h-64 rounded-2xl bg-gray-200" />

                        <div className="h-64 rounded-2xl bg-gray-200" />
                    </div>
                </main>
            </div>
        );
    }

    /*
     * Request not found.
     */
    if (!request) {
        return (
            <div className="min-h-screen bg-gray-50">
                <RoleBasedNavbar />

                <main className="mx-auto max-w-5xl px-6 py-20 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Rental request not found
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        {error ||
                            "Unable to load this rental request."}
                    </p>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mt-6 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        Go Back
                    </button>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <RoleBasedNavbar />

            <main className="mx-auto max-w-5xl px-6 py-10">

                {/* Back */}
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="mb-5 text-sm text-gray-500 hover:text-gray-900"
                >
                    ← Back to Rental Requests
                </button>

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Rental Request
                        </p>

                        <h1 className="mt-1 text-3xl font-bold text-gray-900">
                            {request.rentalRequestId}
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Created on{" "}
                            {formatDateTime(
                                request.createdAt,
                            )}
                        </p>
                    </div>

                    <span
                        className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClasses(
                            request.status,
                        )}`}
                    >
                        {formatStatus(request.status)}
                    </span>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Action Error */}
                {actionError && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {actionError}
                    </div>
                )}

                {/* Product */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Product Information
                        </h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-gray-400">
                                Product
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {request.product?.name ||
                                    request.productId}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Product ID
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {request.productId}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Listed Price
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                ৳{request.listedPricePerDay}/day
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Owner
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {getUserName(request.owner)}
                            </p>
                        </div>

                        {isOwner && request.renter && (
                            <div>
                                <p className="text-xs text-gray-400">
                                    Renter
                                </p>

                                <p className="mt-1 font-semibold text-gray-900">
                                    {getUserName(
                                        request.renter,
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Rental Schedule */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Rental Schedule
                    </h2>

                    <div className="mt-5 grid gap-5 sm:grid-cols-3">
                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs text-gray-500">
                                Start Date
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {formatDate(
                                    request.startDate,
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs text-gray-500">
                                Rental Duration
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {request.rentalDays} day
                                {request.rentalDays !== 1
                                    ? "s"
                                    : ""}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs text-gray-500">
                                End Date
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                                {formatDate(
                                    request.endDate,
                                )}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Delivery */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Delivery Information
                    </h2>

                    <div className="mt-5 space-y-5">
                        <div>
                            <p className="text-xs text-gray-400">
                                Delivery Address
                            </p>

                            <p className="mt-1 text-sm leading-6 text-gray-700">
                                {request.deliveryAddress ||
                                    "N/A"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-400">
                                Pickup Address
                            </p>

                            <p className="mt-1 text-sm leading-6 text-gray-700">
                                {request.pickupAddress ||
                                    "N/A"}
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-gray-400">
                                    Contact Phone
                                </p>

                                <p className="mt-1 text-sm font-medium text-gray-900">
                                    {request.contactPhone}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400">
                                    Latitude
                                </p>

                                <p className="mt-1 text-sm font-medium text-gray-900">
                                    {request.deliveryLatitude ??
                                        "N/A"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400">
                                    Longitude
                                </p>

                                <p className="mt-1 text-sm font-medium text-gray-900">
                                    {request.deliveryLongitude ??
                                        "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Price Information
                    </h2>

                    <div className="mt-5 space-y-4">

                        {/* Listed price */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Listed price / day
                            </span>

                            <span className="font-medium text-gray-900">
                                ৳{request.listedPricePerDay}
                            </span>
                        </div>

                        {/* Initial offer */}
                        {request.offeredPricePerDay != null && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    Initial offer / day
                                </span>

                                <span className="font-medium text-blue-700">
                                    ৳
                                    {
                                        request.offeredPricePerDay
                                    }
                                </span>
                            </div>
                        )}

                        {/* Agreed price */}
                        {request.agreedPricePerDay != null && (
                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <span className="text-sm text-gray-500">
                                    Agreed price / day
                                </span>

                                <span className="font-semibold text-green-700">
                                    ৳
                                    {
                                        request.agreedPricePerDay
                                    }
                                </span>
                            </div>
                        )}

                        {/* Estimated rental amount */}
                        {request.agreedPricePerDay != null && (
                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <span className="text-sm font-medium text-gray-700">
                                    Estimated rental amount
                                </span>

                                <span className="text-lg font-bold text-gray-900">
                                    ৳
                                    {(
                                        Number(
                                            request.agreedPricePerDay,
                                        ) *
                                        request.rentalDays
                                    ).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Message */}
                {request.renterMessage && (
                    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Renter Message
                        </h2>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                            {request.renterMessage}
                        </p>
                    </section>
                )}

                {/* Moderator Review Information */}
                {request.moderator &&
                    (request.status === "APPROVED" ||
                        request.status === "REJECTED") && (
                        <section
                            className={`mb-6 rounded-2xl border p-6 ${
                                request.status ===
                                "APPROVED"
                                    ? "border-green-200 bg-green-50"
                                    : "border-red-200 bg-red-50"
                            }`}
                        >
                            <h2
                                className={`text-lg font-semibold ${
                                    request.status ===
                                    "APPROVED"
                                        ? "text-green-900"
                                        : "text-red-900"
                                }`}
                            >
                                {request.status ===
                                "APPROVED"
                                    ? "Rental Approved"
                                    : "Rental Rejected"}
                            </h2>

                            <p
                                className={`mt-2 text-sm ${
                                    request.status ===
                                    "APPROVED"
                                        ? "text-green-700"
                                        : "text-red-700"
                                }`}
                            >
                                This rental request has been{" "}
                                {request.status ===
                                "APPROVED"
                                    ? "approved"
                                    : "rejected"}{" "}
                                by the moderator.
                            </p>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p
                                        className={`text-xs ${
                                            request.status ===
                                            "APPROVED"
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        Reviewed By
                                    </p>

                                    <p
                                        className={`mt-1 text-sm font-medium ${
                                            request.status ===
                                            "APPROVED"
                                                ? "text-green-900"
                                                : "text-red-900"
                                        }`}
                                    >
                                        {getUserName(
                                            request.moderator,
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p
                                        className={`text-xs ${
                                            request.status ===
                                            "APPROVED"
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        Reviewed At
                                    </p>

                                    <p
                                        className={`mt-1 text-sm font-medium ${
                                            request.status ===
                                            "APPROVED"
                                                ? "text-green-900"
                                                : "text-red-900"
                                        }`}
                                    >
                                        {formatDateTime(
                                            request.reviewedAt,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                {/* Actions */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Actions
                    </h2>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                        {/* RENTER ACTION */}
                        {canNegotiate && (
                            <Link
                                href={`/rental-requests/${request.rentalRequestId}/negotiation`}
                                className="flex-1 rounded-lg bg-black px-5 py-3 text-center text-sm font-medium text-white hover:bg-gray-800"
                            >
                                Open Negotiation
                            </Link>
                        )}

                        {/* OWNER ACTIONS */}
                        {canOwnerTakeAction && (
                            <>
                                <button
                                    type="button"
                                    onClick={
                                        handleAcceptRequest
                                    }
                                    disabled={actionLoading}
                                    className="flex-1 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {actionLoading
                                        ? "Processing..."
                                        : request.status ===
                                            "NEGOTIATING"
                                          ? "Accept Current Price"
                                          : "Accept Request"}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleRejectRequest
                                    }
                                    disabled={actionLoading}
                                    className="flex-1 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {actionLoading
                                        ? "Processing..."
                                        : "Reject Request"}
                                </button>
                            </>
                        )}

                        {/* MODERATOR ACTIONS */}
                        {canModeratorReview && (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleModeratorReview(
                                            "APPROVE",
                                        )
                                    }
                                    disabled={actionLoading}
                                    className="flex-1 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {actionLoading
                                        ? "Processing..."
                                        : "Approve Rental"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleModeratorReview(
                                            "REJECT",
                                        )
                                    }
                                    disabled={actionLoading}
                                    className="flex-1 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {actionLoading
                                        ? "Processing..."
                                        : "Reject Rental"}
                                </button>
                            </>
                        )}

                        {/* PRICE AGREED */}
                        {!isModerator &&
                            request.status ===
                                "PRICE_AGREED" && (
                                <div className="flex-1 rounded-lg bg-purple-50 px-5 py-3 text-center text-sm font-medium text-purple-700">
                                    Price agreed — waiting for
                                    moderator review
                                </div>
                            )}

                        {/* APPROVED */}
                        {request.status === "APPROVED" && (
                            <div className="flex-1 rounded-lg bg-green-50 px-5 py-3 text-center text-sm font-medium text-green-700">
                                Approved — rental process will
                                continue
                            </div>
                        )}

                        {/* REJECTED */}
                        {request.status === "REJECTED" && (
                            <div className="flex-1 rounded-lg bg-red-50 px-5 py-3 text-center text-sm font-medium text-red-700">
                                This rental request was rejected
                            </div>
                        )}

                        {/* EXPIRED */}
                        {request.status === "EXPIRED" && (
                            <div className="flex-1 rounded-lg bg-gray-100 px-5 py-3 text-center text-sm font-medium text-gray-600">
                                This rental request has expired
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}