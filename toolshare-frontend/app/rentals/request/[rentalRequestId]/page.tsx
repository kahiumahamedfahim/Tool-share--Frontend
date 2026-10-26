"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import CustodyTimeline from "@/app/components/rentals/CustodyTimeline";
import api from "@/app/lib/axios";
import {
    confirmPaymentReceived,
    createNegotiationOffer,
    getActualRentalForRequest,
    getNegotiationHistory,
    getPaymentForRequest,
    getRentalChargesForRequest,
    getRentalRequestById,
    updateNegotiationOffer,
    type ActualRental,
    type NegotiationOffer,
    type RentalPaymentInfo,
    type RentalChargeRecord,
    type RentalRequest,
} from "@/app/lib/rental-api";

/* =====================================================
   STATUS CONFIG
===================================================== */

const statusConfig: Record<
    RentalRequest["status"],
    {
        label: string;
        description: string;
        className: string;
        dot: string;
    }
> = {
    PENDING: {
        label: "Pending",
        description:
            "Your request is waiting for the owner's response.",
        className:
            "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
    },

    NEGOTIATING: {
        label: "Negotiating",
        description:
            "A price offer is open and waiting for the other party's response.",
        className:
            "border-indigo-200 bg-indigo-50 text-indigo-700",
        dot: "bg-indigo-500",
    },

    PRICE_AGREED: {
        label: "Price Agreed",
        description:
            "The price has been agreed and is waiting for moderator review.",
        className:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
    },

    APPROVED: {
        label: "Approved",
        description:
            "Your rental request has been approved.",
        className:
            "border-blue-200 bg-blue-50 text-blue-700",
        dot: "bg-blue-500",
    },

    REJECTED: {
        label: "Rejected",
        description:
            "This rental request was rejected.",
        className:
            "border-red-200 bg-red-50 text-red-700",
        dot: "bg-red-500",
    },

    EXPIRED: {
        label: "Expired",
        description:
            "This rental request is no longer active.",
        className:
            "border-slate-200 bg-slate-100 text-slate-600",
        dot: "bg-slate-400",
    },
};

/* =====================================================
   HELPERS
===================================================== */

function formatDate(date?: string) {
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

function formatDateTime(date?: string) {
    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleString(
        "en-BD",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
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

export default function RentalRequestDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const rentalRequestId =
        typeof params.rentalRequestId === "string"
            ? params.rentalRequestId
            : "";

    const [request, setRequest] =
        useState<RentalRequest | null>(null);

    const [offers, setOffers] =
        useState<NegotiationOffer[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [offersLoading, setOffersLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [offerPrice, setOfferPrice] =
        useState("");

    const [offerMessage, setOfferMessage] =
        useState("");

    const [sendingOffer, setSendingOffer] =
        useState(false);

    const [offerError, setOfferError] =
        useState("");

    const [offerSuccess, setOfferSuccess] =
        useState("");

    /* =================================================
       CURRENT USER
       Needed to know which party is viewing:
       the renter and the owner share this page,
       and only the receiver of an offer may
       respond to it.
    ================================================= */

    const [currentUserId, setCurrentUserId] =
        useState<string | null>(null);

    const [respondingOfferId, setRespondingOfferId] =
        useState<string | null>(null);

    const [respondError, setRespondError] =
        useState("");

    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const response =
                    await api.get<{
                        userId: string;
                        role: string;
                    }>("/auth/profile");

                setCurrentUserId(
                    response.data?.userId ?? null,
                );
            } catch (err) {
                console.error(
                    "Failed to load current user:",
                    err,
                );
            }
        };

        loadCurrentUser();
    }, []);

    /* =================================================
       FETCH HELPERS
    ================================================= */

    const loadRequest = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getRentalRequestById(
                rentalRequestId,
            );

            setRequest(data);
        } catch (err: any) {
            console.error(
                "Failed to load rental request:",
                err,
            );

            setError(
                err?.response?.data?.message ||
                    "Unable to load this rental request.",
            );
        } finally {
            setLoading(false);
        }
    };

    const loadOffers = async () => {
        try {
            setOffersLoading(true);

            const data = await getNegotiationHistory(
                rentalRequestId,
            );

            setOffers(data ?? []);
        } catch (err) {
            console.error(
                "Failed to load negotiation history:",
                err,
            );
        } finally {
            setOffersLoading(false);
        }
    };

    /* =================================================
       FETCH REQUEST
    ================================================= */

    useEffect(() => {
        if (!rentalRequestId) {
            return;
        }

        loadRequest();
    }, [rentalRequestId]);

    /* =================================================
       FETCH NEGOTIATION HISTORY
    ================================================= */

    useEffect(() => {
        if (!rentalRequestId) {
            return;
        }

        loadOffers();
    }, [rentalRequestId]);

    /* =================================================
       ACTUAL RENTAL (PHASE 11)
       Shown to the renter and the owner once
       the moderator approves and creates the
       rental from the request.
    ================================================= */

    const [rental, setRental] =
        useState<ActualRental | null>(null);

    const [charges, setCharges] =
        useState<RentalChargeRecord[]>([]);

    const [paymentData, setPaymentData] =
        useState<RentalPaymentInfo | null>(null);

    const [paymentBusy, setPaymentBusy] =
        useState(false);

    const [paymentMessage, setPaymentMessage] =
        useState("");

    const loadPayment = async () => {
        try {
            const data =
                await getPaymentForRequest(
                    rentalRequestId,
                );

            setPaymentData(data);
        } catch (err) {
            console.error(
                "Failed to load payment:",
                err,
            );
        }
    };

    const handleConfirmPayment = async () => {
        const paymentId =
            paymentData?.payment?.paymentId;

        if (!paymentId) {
            return;
        }

        const confirmed = window.confirm(
            "Confirm that you received the cash payment?",
        );

        if (!confirmed) {
            return;
        }

        setPaymentMessage("");

        try {
            setPaymentBusy(true);

            await confirmPaymentReceived(
                paymentId,
            );

            setPaymentMessage(
                "Payment confirmed. Thank you!",
            );

            await loadPayment();
        } catch (err) {
            console.error(
                "Failed to confirm payment:",
                err,
            );

            let message =
                "Unable to confirm the payment.";

            if (
                isAxiosError(err)
            ) {
                const backendMessage =
                    err.response?.data?.message;

                message = Array.isArray(
                    backendMessage,
                )
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setPaymentMessage(message);
        } finally {
            setPaymentBusy(false);
        }
    };

    useEffect(() => {
        if (!rentalRequestId) {
            return;
        }

        if (!request || request.status !== "APPROVED") {
            setRental(null);
            setCharges([]);
            return;
        }

        const loadRental = async () => {
            try {
                const data =
                    await getActualRentalForRequest(
                        rentalRequestId,
                    );

                setRental(data);

                if (data) {
                    setCharges(
                        await getRentalChargesForRequest(rentalRequestId),
                    );
                    await loadPayment();
                } else {
                    setCharges([]);
                }
            } catch (err) {
                console.error(
                    "Failed to load actual rental:",
                    err,
                );
            }
        };

        loadRental();
    }, [request?.status, rentalRequestId]);

    /* =================================================
       DERIVED VALUES
    ================================================= */

    const status = request
        ? statusConfig[request.status]
        : null;

    const currentPrice = useMemo(() => {
        if (!request) {
            return null;
        }

        return (
            request.agreedPricePerDay ??
            request.offeredPricePerDay ??
            request.listedPricePerDay
        );
    }, [request]);

    const canNegotiate =
        request?.product?.negotiationAllowed !== false &&
        (request?.status === "PENDING" ||
            request?.status === "NEGOTIATING");

    const lastOffer =
        offers.length > 0
            ? offers[offers.length - 1]
            : null;

    /*
     * Only the latest PENDING offer can be
     * responded to (the backend enforces
     * this rule as well).
     */

    const latestOffer: NegotiationOffer | null = (() => {
        for (let index = offers.length - 1; index >= 0; index -= 1) {
            const offer = offers[index];

            if (offer.status === "PENDING") {
                return offer;
            }

            if (offer.status === "ACCEPTED") {
                break;
            }
        }

        return null;
    })();

    const isParticipant =
        !!request &&
        !!currentUserId &&
        (request.renterId === currentUserId ||
            request.ownerId === currentUserId);

    const ownerHasResponded =
        !!request &&
        (request.status === "PRICE_AGREED" ||
            request.status === "APPROVED" ||
            request.status === "REJECTED" ||
            offers.some(
                (offer) => offer.senderId === request.ownerId,
            ) ||
            offers.some(
                (offer) =>
                    offer.senderId === request.renterId &&
                    offer.status === "REJECTED",
            ));

    /*
     * You may reply to an offer when it is
     * the latest pending offer and it was
     * NOT sent by you.
     */

    const offerToRespondTo =
        isParticipant &&
        latestOffer &&
        latestOffer.senderId !== currentUserId
            ? latestOffer
            : null;

    const waitingForResponse =
        isParticipant &&
        latestOffer &&
        latestOffer.senderId === currentUserId;

    /* =================================================
       RESPOND TO OFFER (ACCEPT / REJECT)
    ================================================= */

    const handleRespondToOffer = async (
        offerId: string,
        action: "ACCEPT" | "REJECT",
    ) => {
        setRespondError("");
        setOfferSuccess("");

        try {
            setRespondingOfferId(offerId);

            const updatedOffer =
                await updateNegotiationOffer(
                    offerId,
                    action,
                );

            setOfferSuccess(
                action === "ACCEPT"
                    ? `Offer accepted at ৳${formatPrice(updatedOffer.offeredPricePerDay)}/day. Waiting for moderator review.`
                    : "Offer rejected. You can still send a new offer.",
            );

            await loadOffers();

            await loadRequest();
        } catch (err) {
            console.error(
                "Failed to respond to offer:",
                err,
            );

            let message =
                "Unable to respond to this offer.";

            if (isAxiosError(err)) {
                const backendMessage =
                    err.response?.data?.message;

                message = Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setRespondError(message);
        } finally {
            setRespondingOfferId(null);
        }
    };

    /* =================================================
       SEND OFFER
    ================================================= */

    const handleSendOffer = async () => {
        setOfferError("");
        setOfferSuccess("");

        const numericPrice =
            Number(offerPrice);

        if (
            !offerPrice ||
            Number.isNaN(numericPrice) ||
            numericPrice <= 0
        ) {
            setOfferError(
                "Please enter a valid price per day.",
            );
            return;
        }

        try {
            setSendingOffer(true);

            const newOffer =
                await createNegotiationOffer({
                    rentalRequestId,
                    offeredPricePerDay:
                        numericPrice,
                    message:
                        offerMessage.trim() ||
                        undefined,
                });

            setOffers((current) => [
                ...current,
                newOffer,
            ]);

            setOfferPrice("");
            setOfferMessage("");

            setOfferSuccess(
                "Your offer has been sent successfully.",
            );

            setRequest((current) =>
                current
                    ? {
                          ...current,
                          status: "NEGOTIATING",
                      }
                    : current,
            );
        } catch (err: any) {
            console.error(
                "Failed to send offer:",
                err,
            );

            setOfferError(
                err?.response?.data?.message ||
                    "Unable to send your offer.",
            );
        } finally {
            setSendingOffer(false);
        }
    };

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

                            <div className="h-5 w-40 rounded bg-slate-200" />

                            <div className="h-32 rounded-2xl bg-slate-200" />

                            <div className="grid gap-6 lg:grid-cols-3">
                                <div className="h-80 rounded-2xl bg-slate-200 lg:col-span-2" />
                                <div className="h-80 rounded-2xl bg-slate-200" />
                            </div>

                        </div>
                    </div>
                </main>
            </>
        );
    }

    /* =================================================
       ERROR
    ================================================= */

    if (error || !request) {
        return (
            <>
                <RoleBasedNavbar />

                <main className="min-h-screen bg-slate-50">
                    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">

                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
                            !
                        </div>

                        <h1 className="mt-6 text-2xl font-bold text-slate-950">
                            Rental request unavailable
                        </h1>

                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                            {error ||
                                "We could not find this rental request."}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    "/rentals/my-requests",
                                )
                            }
                            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Back to my rentals
                        </button>

                    </div>
                </main>
            </>
        );
    }

    /* =================================================
       PAGE UI
    ================================================= */

    return (
        <>
            <RoleBasedNavbar />

            <main className="min-h-screen bg-slate-50">

                {/* ======================================
                    PAGE HEADER
                ====================================== */}

                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">

                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    "/rentals/my-requests",
                                )
                            }
                            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                        >
                            <span>←</span>

                            Back to My Rentals
                        </button>

                        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

                            <div className="min-w-0">

                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                                    Rental Request
                                </p>

                                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">

                                    <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                        {
                                            request.rentalRequestId
                                        }
                                    </h1>

                                    {status && (
                                        <span
                                            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                            />

                                            {
                                                status.label
                                            }
                                        </span>
                                    )}

                                </div>

                                <p className="mt-2 text-sm text-slate-500">
                                    Product ID:{" "}
                                    <span className="font-medium text-slate-700">
                                        {
                                            request.productId
                                        }
                                    </span>
                                </p>

                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    Submitted
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                    {formatDateTime(
                                        request.createdAt,
                                    )}
                                </p>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ======================================
                    CONTENT
                ====================================== */}

                <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">

                    <div className="grid gap-6 lg:grid-cols-3">

                        {/* =================================
                            LEFT COLUMN
                        ================================= */}

                        <div className="space-y-6 lg:col-span-2">

                            {/* STATUS MESSAGE */}

                            {status && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                    <div className="flex items-start gap-4">

                                        <div
                                            className={`mt-1 h-3 w-3 shrink-0 rounded-full ${status.dot}`}
                                        />

                                        <div>
                                            <h2 className="text-sm font-semibold text-slate-950">
                                                {
                                                    status.label
                                                }
                                            </h2>

                                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                                {
                                                    status.description
                                                }
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* RENTAL INFORMATION */}

                            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-base font-semibold text-slate-950">
                                        Rental information
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Schedule and pricing for
                                        this request.
                                    </p>
                                </div>

                                <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">

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
                                            Listed price / day
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                            ৳
                                            {formatPrice(
                                                request.listedPricePerDay,
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Your offer
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                            {request.offeredPricePerDay
                                                ? `৳${formatPrice(
                                                      request.offeredPricePerDay,
                                                  )}`
                                                : "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Agreed price / day
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-emerald-700">
                                            {request.agreedPricePerDay
                                                ? `৳${formatPrice(
                                                      request.agreedPricePerDay,
                                                  )}`
                                                : "Not agreed"}
                                        </p>
                                    </div>

                                </div>
                            </section>

                            {/* DELIVERY */}

                            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-base font-semibold text-slate-950">
                                        Delivery location
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Your requested delivery
                                        destination.
                                    </p>
                                </div>

                                <div className="p-5">

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                                        <div className="flex items-start gap-3">

                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                                ◉
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-slate-400">
                                                    Address
                                                </p>

                                                <p className="mt-1 text-sm leading-6 text-slate-800">
                                                    {
                                                        request.deliveryAddress
                                                    }
                                                </p>
                                            </div>

                                        </div>

                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">

                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <p className="text-xs text-slate-400">
                                                Latitude
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                {
                                                    request.deliveryLatitude
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <p className="text-xs text-slate-400">
                                                Longitude
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                {
                                                    request.deliveryLongitude
                                                }
                                            </p>
                                        </div>

                                    </div>

                                </div>
                            </section>

                            {/* MODERATOR REVIEW & DELIVERY */}

                            {(request.ownerRentalFee != null ||
                                request.renterRentalFee != null ||
                                request.platformCommissionRate ||
                                request.rider?.userId) && (
                                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                    <div className="border-b border-slate-100 px-5 py-4">

                                        <h2 className="text-base font-semibold text-slate-950">
                                            Moderator review &amp;
                                            delivery
                                        </h2>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Your charges were set by the
                                            moderator during review.
                                        </p>

                                    </div>

                                    <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">

                                        {request.ownerRentalFee != null && (
                                            <div className="rounded-xl border border-slate-200 p-4">
                                                <p className="text-xs text-slate-400">
                                                    Owner rental charge
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    ৳
                                                    {Number(
                                                        request.ownerRentalFee,
                                                    ).toFixed(
                                                        2,
                                                    )}
                                                </p>
                                            </div>
                                        )}

                                        {request.ownerDeliveryFee != null && (
                                            <div className="rounded-xl border border-slate-200 p-4">
                                                <p className="text-xs text-slate-400">Owner delivery charge</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">৳{Number(request.ownerDeliveryFee).toFixed(2)}</p>
                                            </div>
                                        )}

                                        {request.renterRentalFee != null && (
                                            <div className="rounded-xl border border-slate-200 p-4">
                                                <p className="text-xs text-slate-400">Renter rental charge</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">৳{Number(request.renterRentalFee).toFixed(2)}</p>
                                            </div>
                                        )}

                                        {request.renterDeliveryFee != null && (
                                            <div className="rounded-xl border border-slate-200 p-4">
                                                <p className="text-xs text-slate-400">Renter delivery charge</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">৳{Number(request.renterDeliveryFee).toFixed(2)}</p>
                                            </div>
                                        )}

                                        {request.platformCommissionRate && (
                                            <div className="rounded-xl border border-slate-200 p-4">
                                                <p className="text-xs text-slate-400">
                                                    Platform commission
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {Number(
                                                        request.platformCommissionRate,
                                                    ).toFixed(
                                                        2,
                                                    )}
                                                    %
                                                </p>
                                            </div>
                                        )}

                                    </div>

                                    {request.rider && (
                                        <div className="mx-5 mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

                                            <p className="text-xs font-semibold text-blue-700">
                                                Assigned rider
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                {
                                                    request
                                                        .rider
                                                        .firstName
                                                }{" "}
                                                {
                                                    request
                                                        .rider
                                                        .lastName
                                                }
                                            </p>

                                            <p className="mt-1 text-sm text-slate-600">
                                                📞{" "}
                                                {
                                                    request
                                                        .rider
                                                        .phone
                                                }
                                                {" · "}
                                                {
                                                    request
                                                        .rider
                                                        .email
                                                }
                                            </p>

                                        </div>
                                    )}

                                </section>
                            )}

                            {/* ACTUAL RENTAL SUMMARY */}

                            {rental && (
                                <section className="rounded-2xl border border-emerald-200 bg-white shadow-sm">

                                    <div className="border-b border-emerald-100 px-5 py-4">

                                        <div className="flex items-center justify-between gap-4">

                                            <div>
                                                <h2 className="text-base font-semibold text-slate-950">
                                                    Rental
                                                </h2>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Created from
                                                    your approved
                                                    request.
                                                </p>
                                            </div>

                                            <span className="rounded-full border px-3 py-1.5 text-xs font-semibold text-indigo-700">
                                                {rental.status.replace("_", " ")}
                                            </span>

                                        </div>

                                    </div>

                                    <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <p className="text-xs text-slate-400">Rental ID</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">{rental.rentalId}</p>
                                        </div>

                                        {rental.ownerTotalPayable !== undefined && (
                                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                <p className="text-xs text-blue-700">Your owner charges</p>
                                                <p className="mt-1 text-lg font-bold text-blue-800">৳{Number(rental.ownerTotalPayable).toFixed(2)}</p>
                                                <p className="mt-1 text-xs text-blue-700">Rental ৳{Number(rental.ownerRentalFee).toFixed(2)} · Delivery ৳{Number(rental.ownerDeliveryFee).toFixed(2)}</p>
                                            </div>
                                        )}

                                        {rental.renterTotalPayable !== undefined && (
                                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                <p className="text-xs text-blue-700">Your renter charges</p>
                                                <p className="mt-1 text-lg font-bold text-blue-800">৳{Number(rental.renterTotalPayable).toFixed(2)}</p>
                                                <p className="mt-1 text-xs text-blue-700">Rental ৳{Number(rental.renterRentalFee).toFixed(2)} · Delivery ৳{Number(rental.renterDeliveryFee).toFixed(2)}</p>
                                            </div>
                                        )}

                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <p className="text-xs text-slate-400">Agreed price per day</p>
                                            <p className="mt-1 text-sm font-medium text-slate-700">৳{Number(rental.agreedPricePerDay).toFixed(2)} × {rental.rentalDays} days</p>
                                        </div>
                                    </div>

                                    {charges.length > 0 && (
                                        <div className="mx-5 mb-5 rounded-xl border border-slate-200 p-4 sm:mx-6">
                                            <h3 className="font-semibold text-slate-900">Charge collection status</h3>
                                            <p className="mt-1 text-xs text-slate-500">Your separate charges are collected by the assigned rider in cash and verified by a moderator.</p>
                                            <div className="mt-3 divide-y divide-slate-100">
                                                {charges.map((charge) => (
                                                    <div key={charge.chargeId} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                                                        <div>
                                                            <p className="font-medium text-slate-800">{charge.type === "RENTAL" ? "Rental charge" : "Delivery charge"}</p>
                                                            <p className="text-xs text-slate-500">৳{Number(charge.amount).toFixed(2)}</p>
                                                        </div>
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${charge.status === "CONFIRMED" || charge.status === "NO_CHARGE" ? "bg-emerald-50 text-emerald-700" : charge.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                                            {charge.status.replace(/_/g, " ")}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* MANUAL CASH PAYMENT */}

                                    {paymentData?.payment && (
                                        <div className="mx-5 mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                                            <div className="flex flex-wrap items-center justify-between gap-2">

                                                <p className="text-xs font-semibold text-slate-500">
                                                    Cash payment ·
                                                    ৳{Number(paymentData.payment.amount).toFixed(2)}
                                                </p>

                                                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                                    {paymentData.payment.status.replace(/_/g, " ")}
                                                </span>

                                            </div>

                                            <p className="mt-2 text-xs text-slate-500">
                                                {paymentData.payment.status === "PENDING" &&
                                                    "The rider (or owner) will collect the cash at handover."}

                                                {paymentData.payment.status !== "PENDING" &&
                                                    paymentData.payment.collectedAt &&
                                                    `Collected: ${new Date(paymentData.payment.collectedAt).toLocaleString()}`}

                                                {paymentData.payment.deliveredAt &&
                                                    ` · Delivered to owner: ${new Date(paymentData.payment.deliveredAt).toLocaleString()}`}
                                            </p>

                                            {request.ownerId ===
                                                currentUserId &&
                                                (paymentData.payment.status ===
                                                    "COLLECTED_BY_RIDER" ||
                                                    paymentData.payment.status ===
                                                        "DELIVERED_TO_OWNER") && (
                                                    <button
                                                        type="button"
                                                        disabled={paymentBusy}
                                                        onClick={handleConfirmPayment}
                                                        className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {paymentBusy
                                                            ? "Processing..."
                                                            : "I received the payment"}
                                                    </button>
                                                )}

                                            {paymentMessage && (
                                                <p className="mt-2 text-xs font-medium text-slate-600">
                                                    {paymentMessage}
                                                </p>
                                            )}

                                        </div>
                                    )}

                                </section>
                            )}

                            {/* NEGOTIATION */}

                            {request.product?.negotiationAllowed === false ? (
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h2 className="text-base font-semibold text-slate-950">
                                        Negotiation unavailable
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        The owner set a fixed price for this product, so offers cannot be sent.
                                    </p>
                                </section>
                            ) : (
                            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 px-5 py-4">

                                    <div className="flex items-center justify-between gap-4">

                                        <div>
                                            <h2 className="text-base font-semibold text-slate-950">
                                                Negotiation
                                            </h2>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Review the offer history
                                                and negotiate the daily
                                                rental price.
                                            </p>
                                        </div>

                                        {offers.length > 0 && (
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                {
                                                    offers.length
                                                }{" "}
                                                offer
                                                {offers.length !==
                                                1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                        )}

                                    </div>
                                </div>

                                <div className="p-5">

                                    {/* OFFER HISTORY */}

                                    {offersLoading ? (
                                        <div className="space-y-3">
                                            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                                            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                                        </div>
                                    ) : offers.length ===
                                      0 ? (
                                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">

                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-lg text-slate-400 shadow-sm">
                                                ৳
                                            </div>

                                            <p className="mt-4 text-sm font-semibold text-slate-800">
                                                No negotiation yet
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                You can send an offer
                                                when negotiation is
                                                available.
                                            </p>

                                        </div>
                                    ) : (
                                        <div className="space-y-3">

                                            {offers.map(
                                                (
                                                    offer,
                                                ) => {
                                                    const isAccepted =
                                                        offer.status ===
                                                        "ACCEPTED";

                                                    const isRejected =
                                                        offer.status ===
                                                        "REJECTED";

                                                    return (
                                                        <div
                                                            key={
                                                                offer.offerId
                                                            }
                                                            className={`rounded-xl border p-4 ${
                                                                isAccepted
                                                                    ? "border-emerald-200 bg-emerald-50/50"
                                                                    : isRejected
                                                                      ? "border-red-200 bg-red-50/50"
                                                                      : "border-slate-200 bg-slate-50"
                                                            }`}
                                                        >

                                                            <div className="flex items-start justify-between gap-4">

                                                                <div>
                                                                    <p className="text-xs font-medium text-slate-400">
                                                                        Offer
                                                                    </p>

                                                                    <p className="mt-1 text-lg font-bold text-slate-950">
                                                                        ৳
                                                                        {formatPrice(
                                                                            offer.offeredPricePerDay,
                                                                        )}
                                                                        <span className="ml-1 text-xs font-medium text-slate-400">
                                                                            /day
                                                                        </span>
                                                                    </p>
                                                                </div>

                                                                <span
                                                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                                                        isAccepted
                                                                            ? "bg-emerald-100 text-emerald-700"
                                                                            : isRejected
                                                                              ? "bg-red-100 text-red-700"
                                                                              : "bg-white text-slate-500"
                                                                    }`}
                                                                >
                                                                    {
                                                                        offer.status
                                                                    }
                                                                </span>

                                                            </div>

                                                            {offer.message && (
                                                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                                                    {
                                                                        offer.message
                                                                    }
                                                                </p>
                                                            )}

                                                            <div className="mt-3 text-[11px] text-slate-400">
                                                                {
                                                                    offer.senderId
                                                                }{" "}
                                                                ·{" "}
                                                                {formatDateTime(
                                                                    offer.createdAt,
                                                                )}
                                                            </div>

                                                            {/* ==================================
                                                                RESPOND TO OFFER
                                                                Only the receiver of the
                                                                latest pending offer may
                                                                accept or reject it.
                                                            ================================== */}

                                                            {canNegotiate &&
                                                                offerToRespondTo?.offerId ===
                                                                    offer.offerId && (
                                                                    <div className="mt-4 border-t border-slate-100 pt-4">
                                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                                            <p className="text-xs text-slate-500">
                                                                                {offer.senderId ===
                                                                                request.renterId
                                                                                    ? "Offer from the renter"
                                                                                    : "Offer from the owner"}
                                                                            </p>

                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={
                                                                                        respondingOfferId !==
                                                                                        null
                                                                                    }
                                                                                    onClick={() =>
                                                                                        handleRespondToOffer(
                                                                                            offer.offerId,
                                                                                            "REJECT",
                                                                                        )
                                                                                    }
                                                                                    className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                                >
                                                                                    Reject
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    disabled={
                                                                                        respondingOfferId !==
                                                                                        null
                                                                                    }
                                                                                    onClick={() =>
                                                                                        handleRespondToOffer(
                                                                                            offer.offerId,
                                                                                            "ACCEPT",
                                                                                        )
                                                                                    }
                                                                                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                                >
                                                                                    {respondingOfferId ===
                                                                                    offer.offerId
                                                                                        ? "Processing..."
                                                                                        : "Accept offer"}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                        </div>
                                                    );
                                                },
                                            )}

                                        </div>
                                    )}

                                    {/* OFFER STATUS BANNERS */}

                                    {respondError && (
                                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                            {respondError}
                                        </div>
                                    )}

                                    {offerSuccess && (
                                        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                                            {offerSuccess}
                                        </div>
                                    )}

                                    {canNegotiate &&
                                        waitingForResponse && (
                                            <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700">
                                                You made the latest
                                                offer. Waiting for the
                                                other party&apos;s
                                                response before you can
                                                send a new offer.
                                            </div>
                                        )}

                                    {/* SEND OFFER */}

                                    {canNegotiate &&
                                        isParticipant &&
                                        !waitingForResponse && (
                                        <div className="mt-6 border-t border-slate-100 pt-6">

                                            <div className="mb-4">
                                                <h3 className="text-sm font-semibold text-slate-950">
                                                    Make an offer
                                                </h3>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    Current listed price:
                                                    {" "}
                                                    <span className="font-semibold text-slate-700">
                                                        ৳
                                                        {formatPrice(
                                                            request.listedPricePerDay,
                                                        )}
                                                        /day
                                                    </span>
                                                </p>
                                            </div>

                                            {offerError && (
                                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                                    {
                                                        offerError
                                                    }
                                                </div>
                                            )}

                                            {offerSuccess && (
                                                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                                                    {
                                                        offerSuccess
                                                    }
                                                </div>
                                            )}

                                            <div className="grid gap-4 md:grid-cols-2">

                                                <div>
                                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                        Price per day
                                                    </label>

                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                                            ৳
                                                        </span>

                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={
                                                                offerPrice
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                setOfferPrice(
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Enter your offer"
                                                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-8 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                        Message
                                                    </label>

                                                    <input
                                                        type="text"
                                                        maxLength={
                                                            1000
                                                        }
                                                        value={
                                                            offerMessage
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            setOfferMessage(
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Optional message"
                                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                                                    />
                                                </div>

                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    sendingOffer
                                                }
                                                onClick={
                                                    handleSendOffer
                                                }
                                                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {sendingOffer
                                                    ? "Sending offer..."
                                                    : "Send offer"}
                                            </button>

                                        </div>
                                    )}

                                </div>
                            </section>
                            )}

                        </div>

                        {/* =================================
                            RIGHT COLUMN
                        ================================= */}

                        <aside className="space-y-6">

                            {/* REQUEST SUMMARY */}

                            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-base font-semibold text-slate-950">
                                        Request summary
                                    </h2>
                                </div>

                                <div className="space-y-4 p-5">

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-slate-500">
                                            Product
                                        </span>

                                        <span className="text-right text-sm font-semibold text-slate-800">
                                            {
                                                request.productId
                                            }
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-slate-500">
                                            Duration
                                        </span>

                                        <span className="text-sm font-semibold text-slate-800">
                                            {
                                                request.rentalDays
                                            }{" "}
                                            days
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-slate-500">
                                            Current price
                                        </span>

                                        <span className="text-sm font-bold text-slate-950">
                                            ৳
                                            {formatPrice(
                                                currentPrice ??
                                                    undefined,
                                            )}
                                            <span className="text-xs font-medium text-slate-400">
                                                /day
                                            </span>
                                        </span>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">
                                                Estimated rental
                                            </span>

                                            <span className="text-lg font-bold text-slate-950">
                                                ৳
                                                {currentPrice
                                                    ? formatPrice(
                                                          String(
                                                              Number(
                                                                  currentPrice,
                                                              ) *
                                                                  request.rentalDays,
                                                          ),
                                                      )
                                                    : "—"}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-right text-[10px] text-slate-400">
                                            Rental price only
                                        </p>

                                    </div>

                                </div>
                            </section>

                            {/* STATUS TIMELINE */}

                            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-base font-semibold text-slate-950">
                                        Request progress
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Current position in the
                                        rental workflow.
                                    </p>
                                </div>

                                <div className="p-5">

                                    {[
                                        {
                                            label: "Request submitted",
                                            active: true,
                                        },
                                        {
                                            label: "Owner response",
                                            active: ownerHasResponded,
                                        },
                                        {
                                            label: "Price agreed",
                                            active:
                                                request.status ===
                                                    "PRICE_AGREED" ||
                                                request.status ===
                                                    "APPROVED",
                                        },
                                        {
                                            label: "Moderator review",
                                            active:
                                                request.status ===
                                                "APPROVED",
                                        },
                                        {
                                            label: "Rental approved",
                                            active:
                                                request.status ===
                                                "APPROVED",
                                        },
                                    ].map(
                                        (
                                            step,
                                            index,
                                            array,
                                        ) => (
                                            <div
                                                key={
                                                    step.label
                                                }
                                                className="flex gap-3"
                                            >

                                                <div className="flex flex-col items-center">

                                                    <div
                                                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                                            step.active
                                                                ? "bg-indigo-600 text-white"
                                                                : "border border-slate-200 bg-white text-slate-400"
                                                        }`}
                                                    >
                                                        {step.active
                                                            ? "✓"
                                                            : index +
                                                              1}
                                                    </div>

                                                    {index <
                                                        array.length -
                                                            1 && (
                                                        <div
                                                            className={`my-1 min-h-7 w-px ${
                                                                step.active
                                                                    ? "bg-indigo-200"
                                                                    : "bg-slate-200"
                                                            }`}
                                                        />
                                                    )}

                                                </div>

                                                <div className="pt-1">
                                                    <p
                                                        className={`text-sm font-medium ${
                                                            step.active
                                                                ? "text-slate-800"
                                                                : "text-slate-400"
                                                        }`}
                                                    >
                                                        {
                                                            step.label
                                                        }
                                                    </p>
                                                </div>

                                            </div>
                                        ),
                                    )}

                                </div>
                            </section>

                            {/* CONTACT */}

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Contact
                                </p>

                                <p className="mt-2 text-sm font-semibold text-slate-800">
                                    {
                                        request.contactPhone
                                    }
                                </p>

                                {request.renterMessage && (
                                    <>
                                        <div className="my-4 border-t border-slate-100" />

                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Your message
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {
                                                request.renterMessage
                                            }
                                        </p>
                                    </>
                                )}

                            </section>

                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}
