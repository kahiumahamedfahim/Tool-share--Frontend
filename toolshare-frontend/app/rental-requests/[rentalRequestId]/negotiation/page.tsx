"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import api from "@/app/lib/axios";
import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";

interface NegotiationUser {
    userId: string;
    firstName?: string;
    lastName?: string;
}

type NegotiationOfferStatus =
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED";

interface NegotiationOffer {
    id: string;
    offerId: string;
    rentalRequestId: string;
    senderId: string;
    offeredPricePerDay: string | number;
    message?: string | null;
    status: NegotiationOfferStatus;
    createdAt: string;
    sender?: NegotiationUser;
}

interface RentalRequest {
    rentalRequestId: string;
    renterId: string;
    ownerId: string;
    status:
        | "PENDING"
        | "NEGOTIATING"
        | "PRICE_AGREED"
        | "REJECTED"
        | "EXPIRED"
        | "APPROVED";
    listedPricePerDay: string | number;
    offeredPricePerDay?: string | number | null;
    agreedPricePerDay?: string | number | null;
}

const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const getUserName = (user?: NegotiationUser) => {
    if (!user) {
        return "User";
    }

    const name = `${user.firstName || ""} ${
        user.lastName || ""
    }`.trim();

    return name || user.userId;
};

const getOfferStatusClasses = (
    status: NegotiationOfferStatus,
) => {
    switch (status) {
        case "ACCEPTED":
            return "bg-green-100 text-green-700";

        case "REJECTED":
            return "bg-red-100 text-red-700";

        case "PENDING":
        default:
            return "bg-yellow-100 text-yellow-700";
    }
};

export default function NegotiationPage() {
    const params = useParams();

    const rentalRequestId =
        params.rentalRequestId as string;

    const [offers, setOffers] = useState<
        NegotiationOffer[]
    >([]);

    const [rentalRequest, setRentalRequest] =
        useState<RentalRequest | null>(null);

    const [currentUserId, setCurrentUserId] =
        useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [responseLoading, setResponseLoading] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [offeredPricePerDay, setOfferedPricePerDay] =
        useState("");

    const [message, setMessage] = useState("");

    /*
     * Get current logged-in user.
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
        } catch (err) {
            console.error(
                "Failed to read logged-in user:",
                err,
            );
        }
    }, []);

    /*
     * Fetch rental request.
     *
     * This is used to know:
     * - renter
     * - owner
     * - current request status
     * - agreed price
     */
    const fetchRentalRequest = async () => {
        try {
            const response = await api.get(
                `/rental/request/${encodeURIComponent(
                    rentalRequestId,
                )}`,
            );

            const data =
                response.data?.data ??
                response.data;

            setRentalRequest(data);
        } catch (err) {
            console.error(
                "Failed to fetch rental request:",
                err,
            );
        }
    };

    /*
     * Fetch negotiation history.
     */
    const fetchNegotiationHistory = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/rental/negotiation/${encodeURIComponent(
                    rentalRequestId,
                )}`,
            );

            const responseData = response.data;

            if (Array.isArray(responseData)) {
                setOffers(responseData);
            } else if (
                Array.isArray(responseData?.data)
            ) {
                setOffers(responseData.data);
            } else {
                setOffers([]);
            }
        } catch (err: any) {
            console.error(
                "Failed to fetch negotiation history:",
                err,
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to load negotiation history.",
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * Initial data loading.
     */
    useEffect(() => {
        if (!rentalRequestId) {
            return;
        }

        const loadData = async () => {
            await Promise.all([
                fetchRentalRequest(),
                fetchNegotiationHistory(),
            ]);
        };

        loadData();
    }, [rentalRequestId]);

    /*
     * Latest offer.
     *
     * Backend only allows the latest PENDING offer
     * to be responded to.
     */
    const latestPendingOffer = useMemo(() => {
        const pendingOffers = offers.filter(
            (offer) =>
                offer.status === "PENDING",
        );

        if (pendingOffers.length === 0) {
            return null;
        }

        return [...pendingOffers].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )[0];
    }, [offers]);

    /*
     * Check whether current user is renter.
     */
    const isRenter =
        !!currentUserId &&
        !!rentalRequest &&
        rentalRequest.renterId === currentUserId;

    /*
     * Check whether current user is owner.
     */
    const isOwner =
        !!currentUserId &&
        !!rentalRequest &&
        rentalRequest.ownerId === currentUserId;

    /*
     * Negotiation is available only while:
     *
     * PENDING
     * or
     * NEGOTIATING
     */
    const negotiationAllowed =
        rentalRequest?.status === "PENDING" ||
        rentalRequest?.status === "NEGOTIATING";

    /*
     * User can send a new offer only when:
     *
     * 1. Request is negotiable
     * 2. There is no pending offer from the other
     *    party waiting for response
     *
     * If the latest pending offer belongs to the
     * current user, they must wait.
     */
    const canSendOffer =
        negotiationAllowed &&
        !!currentUserId &&
        (!latestPendingOffer ||
            latestPendingOffer.senderId ===
                currentUserId);

    /*
     * More precisely:
     *
     * If latest pending offer belongs to the other
     * party -> current user should respond first.
     */
    const mustRespondToOffer =
        negotiationAllowed &&
        !!latestPendingOffer &&
        latestPendingOffer.senderId !==
            currentUserId;

    /*
     * Submit a new offer.
     */
    const handleSubmitOffer = async (
        e: FormEvent<HTMLFormElement>,
    ) => {
        e.preventDefault();

        if (!negotiationAllowed) {
            setError(
                "Negotiation is no longer available for this request.",
            );
            return;
        }

        if (mustRespondToOffer) {
            setError(
                "Please respond to the latest offer before making another offer.",
            );
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            const price =
                Number(offeredPricePerDay);

            if (
                !Number.isFinite(price) ||
                price <= 0
            ) {
                setError(
                    "Please enter a valid price per day.",
                );
                return;
            }

            if (
                Math.round(price * 100) /
                    100 !==
                price
            ) {
                setError(
                    "Price can have maximum 2 decimal places.",
                );
                return;
            }

            if (message.trim().length > 1000) {
                setError(
                    "Message cannot exceed 1000 characters.",
                );
                return;
            }

            await api.post(
                "/rental/negotiation/offer",
                {
                    rentalRequestId,
                    offeredPricePerDay: price,
                    message:
                        message.trim() ||
                        undefined,
                },
            );

            setSuccess(
                "Your offer has been sent successfully.",
            );

            setOfferedPricePerDay("");
            setMessage("");

            await Promise.all([
                fetchRentalRequest(),
                fetchNegotiationHistory(),
            ]);
        } catch (err: any) {
            console.error(
                "Failed to submit negotiation offer:",
                err,
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to send your offer.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    /*
     * Accept / reject latest offer.
     *
     * Backend expects:
     *
     * {
     *     action: "ACCEPTED"
     * }
     *
     * or
     *
     * {
     *     action: "REJECTED"
     * }
     */
    const handleOfferResponse = async (
        offer: NegotiationOffer,
        action: "ACCEPTED" | "REJECTED",
    ) => {
        if (!currentUserId) {
            setError(
                "Unable to identify the current user.",
            );
            return;
        }

        if (
            offer.status !== "PENDING"
        ) {
            setError(
                "This offer is no longer active.",
            );
            return;
        }

        if (
            offer.senderId === currentUserId
        ) {
            setError(
                "You cannot respond to your own offer.",
            );
            return;
        }

        if (
            !rentalRequest ||
            !negotiationAllowed
        ) {
            setError(
                "This rental request is no longer available for negotiation.",
            );
            return;
        }

        if (
            latestPendingOffer?.offerId !==
            offer.offerId
        ) {
            setError(
                "Only the latest pending offer can be responded to.",
            );
            return;
        }

        const confirmed = window.confirm(
            action === "ACCEPTED"
                ? "Are you sure you want to accept this offer?"
                : "Are you sure you want to reject this offer?",
        );

        if (!confirmed) {
            return;
        }

        try {
            setResponseLoading(true);
            setError("");
            setSuccess("");

            await api.patch(
                `/rental/negotiation/offer/${encodeURIComponent(
                    offer.offerId,
                )}`,
                {
                    action,
                },
            );

            if (action === "ACCEPTED") {
                setSuccess(
                    "Offer accepted. The rental request is now waiting for moderator review.",
                );
            } else {
                setSuccess(
                    "Offer rejected successfully.",
                );
            }

            await Promise.all([
                fetchRentalRequest(),
                fetchNegotiationHistory(),
            ]);
        } catch (err: any) {
            console.error(
                "Failed to respond to negotiation offer:",
                err,
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to respond to the offer.",
            );
        } finally {
            setResponseLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <RoleBasedNavbar />

            <main className="mx-auto max-w-4xl px-6 py-10">

                {/* Back */}
                <Link
                    href={`/rental-requests/${rentalRequestId}`}
                    className="text-sm text-gray-500 hover:text-gray-900"
                >
                    ← Back to Request Details
                </Link>

                {/* Header */}
                <div className="mt-6 mb-8">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Rental Negotiation
                    </p>

                    <h1 className="mt-1 text-3xl font-bold text-gray-900">
                        Price Negotiation
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Request ID:{" "}
                        {rentalRequestId}
                    </p>
                </div>

                {/* Request status */}
                {rentalRequest && (
                    <div className="mb-6 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs text-gray-400">
                                    Request Status
                                </p>

                                <p className="mt-1 font-semibold text-gray-900">
                                    {rentalRequest.status.replace(
                                        "_",
                                        " ",
                                    )}
                                </p>
                            </div>

                            {rentalRequest.agreedPricePerDay !=
                                null && (
                                <div>
                                    <p className="text-xs text-gray-400">
                                        Agreed Price / Day
                                    </p>

                                    <p className="mt-1 text-lg font-bold text-green-700">
                                        ৳
                                        {
                                            rentalRequest.agreedPricePerDay
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {success}
                    </div>
                )}

                {/* Latest offer response area */}
                {latestPendingOffer &&
                    currentUserId &&
                    latestPendingOffer.senderId !==
                        currentUserId &&
                    negotiationAllowed && (
                        <section className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                            <div className="mb-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                                    Response Required
                                </p>

                                <h2 className="mt-1 text-xl font-semibold text-blue-950">
                                    {getUserName(
                                        latestPendingOffer.sender,
                                    )}{" "}
                                    sent you an offer
                                </h2>
                            </div>

                            <div className="rounded-xl bg-white p-5">
                                <p className="text-xs text-gray-400">
                                    Offered Price
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    ৳
                                    {
                                        latestPendingOffer.offeredPricePerDay
                                    }
                                    <span className="ml-1 text-sm font-normal text-gray-500">
                                        /day
                                    </span>
                                </p>

                                {latestPendingOffer.message && (
                                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                                        <p className="text-sm leading-6 text-gray-600">
                                            {
                                                latestPendingOffer.message
                                            }
                                        </p>
                                    </div>
                                )}

                                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        disabled={
                                            responseLoading
                                        }
                                        onClick={() =>
                                            handleOfferResponse(
                                                latestPendingOffer,
                                                "ACCEPTED",
                                            )
                                        }
                                        className="flex-1 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {responseLoading
                                            ? "Processing..."
                                            : "Accept Offer"}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            responseLoading
                                        }
                                        onClick={() =>
                                            handleOfferResponse(
                                                latestPendingOffer,
                                                "REJECTED",
                                            )
                                        }
                                        className="flex-1 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {responseLoading
                                            ? "Processing..."
                                            : "Reject Offer"}
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                {/* Send Offer */}
                {negotiationAllowed && (
                    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Make a New Offer
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Send your proposed rental
                                price to the other party.
                            </p>
                        </div>

                        {mustRespondToOffer ? (
                            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4">
                                <p className="text-sm leading-6 text-yellow-800">
                                    The other party has sent
                                    you a pending offer. Please
                                    accept or reject that offer
                                    before sending a new one.
                                </p>
                            </div>
                        ) : (
                            <form
                                onSubmit={
                                    handleSubmitOffer
                                }
                            >
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Price Per Day
                                    </label>

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            offeredPricePerDay
                                        }
                                        onChange={(e) =>
                                            setOfferedPricePerDay(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter your offer"
                                        required
                                        disabled={
                                            submitting
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                                    />
                                </div>

                                <div className="mt-5">
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Message{" "}
                                            <span className="font-normal text-gray-400">
                                                (Optional)
                                            </span>
                                        </label>

                                        <span className="text-xs text-gray-400">
                                            {message.length}/1000
                                        </span>
                                    </div>

                                    <textarea
                                        value={message}
                                        onChange={(e) =>
                                            setMessage(
                                                e.target.value,
                                            )
                                        }
                                        rows={4}
                                        maxLength={1000}
                                        placeholder="Write a message to the other party..."
                                        disabled={
                                            submitting
                                        }
                                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                                    />
                                </div>

                                <div className="mt-5 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={
                                            submitting
                                        }
                                        className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {submitting
                                            ? "Sending..."
                                            : "Send Offer"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                )}

                {/* Request no longer negotiable */}
                {!negotiationAllowed &&
                    rentalRequest && (
                        <div className="mb-8 rounded-xl border border-gray-200 bg-gray-100 px-5 py-4">
                            <p className="text-sm leading-6 text-gray-600">
                                Negotiation is no longer
                                available because this request
                                is currently{" "}
                                <strong>
                                    {rentalRequest.status.replace(
                                        "_",
                                        " ",
                                    )}
                                </strong>
                                .
                            </p>
                        </div>
                    )}

                {/* History */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Negotiation History
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            View all offers exchanged for
                            this rental request.
                        </p>
                    </div>

                    {loading ? (
                        <div className="space-y-5">
                            {[1, 2, 3].map(
                                (item) => (
                                    <div
                                        key={item}
                                        className="animate-pulse rounded-xl bg-gray-50 p-5"
                                    >
                                        <div className="h-4 w-32 rounded bg-gray-200" />

                                        <div className="mt-3 h-6 w-24 rounded bg-gray-200" />

                                        <div className="mt-3 h-4 w-64 rounded bg-gray-200" />
                                    </div>
                                ),
                            )}
                        </div>
                    ) : offers.length === 0 ? (
                        <div className="rounded-xl bg-gray-50 px-6 py-12 text-center">
                            <div className="text-3xl">
                                💬
                            </div>

                            <h3 className="mt-4 font-semibold text-gray-900">
                                No negotiation offers yet
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                Send the first offer to start
                                the negotiation.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {offers.map(
                                (offer) => {
                                    const isOwnOffer =
                                        offer.senderId ===
                                        currentUserId;

                                    const isLatestPending =
                                        latestPendingOffer?.offerId ===
                                        offer.offerId;

                                    const canRespond =
                                        !isOwnOffer &&
                                        isLatestPending &&
                                        offer.status ===
                                            "PENDING" &&
                                        negotiationAllowed;

                                    return (
                                        <div
                                            key={
                                                offer.offerId
                                            }
                                            className={`rounded-xl border p-5 ${
                                                isLatestPending &&
                                                offer.status ===
                                                    "PENDING"
                                                    ? "border-blue-200 bg-blue-50/40"
                                                    : "border-gray-200"
                                            }`}
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs text-gray-400">
                                                            {isOwnOffer
                                                                ? "You"
                                                                : getUserName(
                                                                      offer.sender,
                                                                  )}
                                                        </p>

                                                        {isOwnOffer && (
                                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                                                YOUR OFFER
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="mt-1 text-xl font-bold text-gray-900">
                                                        ৳
                                                        {
                                                            offer.offeredPricePerDay
                                                        }

                                                        <span className="ml-1 text-sm font-normal text-gray-500">
                                                            /day
                                                        </span>
                                                    </p>
                                                </div>

                                                <span
                                                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getOfferStatusClasses(
                                                        offer.status,
                                                    )}`}
                                                >
                                                    {
                                                        offer.status
                                                    }
                                                </span>
                                            </div>

                                            {offer.message && (
                                                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                                                    <p className="text-sm leading-6 text-gray-600">
                                                        {
                                                            offer.message
                                                        }
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-4 flex flex-col gap-1 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                                                <span>
                                                    Offer ID:{" "}
                                                    {
                                                        offer.offerId
                                                    }
                                                </span>

                                                <span>
                                                    {formatDateTime(
                                                        offer.createdAt,
                                                    )}
                                                </span>
                                            </div>

                                            {canRespond && (
                                                <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            responseLoading
                                                        }
                                                        onClick={() =>
                                                            handleOfferResponse(
                                                                offer,
                                                                "ACCEPTED",
                                                            )
                                                        }
                                                        className="flex-1 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {responseLoading
                                                            ? "Processing..."
                                                            : "Accept Offer"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            responseLoading
                                                        }
                                                        onClick={() =>
                                                            handleOfferResponse(
                                                                offer,
                                                                "REJECTED",
                                                            )
                                                        }
                                                        className="flex-1 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {responseLoading
                                                            ? "Processing..."
                                                            : "Reject Offer"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    )}
                </section>

                {/* Information */}
                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
                    <p className="text-sm leading-6 text-blue-700">
                        When both parties agree on an offer,
                        the rental request moves to{" "}
                        <strong>PRICE AGREED</strong>. After
                        that, the request proceeds to moderator
                        review.
                    </p>
                </div>
            </main>
        </div>
    );
}