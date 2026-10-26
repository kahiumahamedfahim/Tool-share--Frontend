"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import ModeratorNavbar from "@/app/components/moderator/ModeratorNavbar";
import {
    assignRiderToHandoverStage,
    decideEarlyReturn,
    getCustodyTimeline,
    getHandoverRiderAssignments,
    submitModeratorGate,
    type CustodyTimeline,
    type HandoverRiderAssignments,
    type HandoverStage,
} from "@/app/lib/handover-api";
import {
    createActualRental,
    getActualRentalForRequest,
    getNegotiationHistory,
    getRentalChargesForRequest,
    getRentalRequestById,
    getRiders,
    reviewRentalRequest,
    reviewRentalChargeCollection,
    submitPickupReview,
    submitReturnReview,
    type ActualRental,
    type NegotiationOffer,
    type RentalRequest,
    type RiderInfo,
    type RentalChargeRecord,
} from "@/app/lib/rental-api";

/* Helper - Price */
const formatPrice = (value: string | number) =>
    Number(value ?? 0).toFixed(2);

/* Helper - Date */
const formatDate = (value: string) =>
    new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const RIDER_HANDOFF_STAGES: HandoverStage[] = [
    "OWNER_HANDOVER",
    "DELIVERED_TO_RENTER",
    "RETURN_PICKUP",
    "OWNER_RETURN",
];

const HANDOFF_LABELS: Record<HandoverStage, string> = {
    OWNER_HANDOVER: "Pickup from owner",
    WAREHOUSE_IN: "Warehouse inspection (pickup leg)",
    DELIVERED_TO_RENTER: "Delivery to renter",
    RETURN_PICKUP: "Pickup from renter",
    RETURN_WAREHOUSE_IN: "Warehouse inspection (return leg)",
    OWNER_RETURN: "Return to owner",
};

export default function ModeratorRentalReviewPage() {
    const { rentalRequestId } = useParams<{

        rentalRequestId: string;
    }>();

    const router = useRouter();

    const [request, setRequest] =
        useState<RentalRequest | null>(
            null,
        );

    const [offers, setOffers] = useState<
        NegotiationOffer[]
    >([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [actionError, setActionError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [processing, setProcessing] =
        useState(false);

    /* =================================================
       DECISION INPUTS (APPROVE)
    ================================================= */

    const [ownerRentalFee, setOwnerRentalFee] = useState("0");
    const [ownerDeliveryFee, setOwnerDeliveryFee] = useState("0");
    const [renterRentalFee, setRenterRentalFee] = useState("0");
    const [renterDeliveryFee, setRenterDeliveryFee] = useState("0");

    const [commissionRate, setCommissionRate] =
        useState("10");

    const [riderId, setRiderId] =
        useState("");

    const [riders, setRiders] = useState<
        RiderInfo[]
    >([]);

    /* =================================================
       CONDITION REVIEW INPUTS
    ================================================= */

    const [conditionNote, setConditionNote] =
        useState("");

    /* =================================================
       ACTUAL RENTAL (PHASE 11)
    ================================================= */

    const [rental, setRental] =
        useState<ActualRental | null>(
            null,
        );

    const [stageAssignments, setStageAssignments] = useState<HandoverRiderAssignments | null>(null);
    const [nextStageRiderId, setNextStageRiderId] = useState("");
    const [savingStageAssignment, setSavingStageAssignment] = useState(false);
    const [custodyTimeline, setCustodyTimeline] = useState<CustodyTimeline | null>(null);
    const [handoverReviewNote, setHandoverReviewNote] = useState("");
    const [reviewingHandover, setReviewingHandover] = useState(false);

    const [creatingRental, setCreatingRental] =
        useState(false);

    const [charges, setCharges] = useState<RentalChargeRecord[]>([]);
    const [reviewingChargeId, setReviewingChargeId] = useState<string | null>(null);
    const [chargeReviewNote, setChargeReviewNote] = useState("");

    const loadCharges = async () => {
        try {
            setCharges(await getRentalChargesForRequest(rentalRequestId));
        } catch (err) {
            console.error("Failed to load rental charges:", err);
        }
    };

    useEffect(() => {
        const loadRental = async () => {
            try {
                const data =
                    await getActualRentalForRequest(
                        rentalRequestId,
                    );

                setRental(data);
                if (data) {
                    await loadCharges();
                }
            } catch (err) {
                console.error(
                    "Failed to load actual rental:",
                    err,
                );
            }
        };

        if (request?.status === "APPROVED") {
            loadRental();
        }
    }, [request?.status, rentalRequestId]);

    useEffect(() => {
        if (!rental?.rentalId) return;
        const loadAssignments = async () => {
            try {
                const [data, timeline] = await Promise.all([
                    getHandoverRiderAssignments(rental.rentalId),
                    getCustodyTimeline(rental.rentalId),
                ]);
                setStageAssignments(data);
                setCustodyTimeline(timeline);
                const existing = data.assignments
                    .filter((assignment) => assignment.stage === data.nextStage)
                    .at(-1);
                setNextStageRiderId(existing?.riderId ?? (
                    data.nextStage === "OWNER_HANDOVER" ? rental.riderId ?? "" : ""
                ));
            } catch (err) {
                console.error("Failed to load handoff rider assignments:", err);
            }
        };
        void loadAssignments();
    }, [rental?.rentalId, rental?.riderId]);

    useEffect(() => {
        const loadRiders = async () => {
            try {
                const data = await getRiders();

                setRiders(data ?? []);
            } catch (err) {
                console.error(
                    "Failed to load riders:",
                    err,
                );
            }
        };

        loadRiders();
    }, []);

    /* =================================================
       LOAD
    ================================================= */

    const loadRequest = async () => {
        try {
            setLoading(true);
            setError("");

            const data =
                await getRentalRequestById(
                    rentalRequestId,
                );

            setRequest(data);
        } catch (err) {
            console.error(
                "Failed to load rental request:",
                err,
            );

            let message =
                "Unable to load this rental request.";

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

    const loadOffers = async () => {
        try {
            const data =
                await getNegotiationHistory(
                    rentalRequestId,
                );

            setOffers(data ?? []);
        } catch (err) {
            console.error(
                "Failed to load negotiation history:",
                err,
            );
        }
    };

    useEffect(() => {
        if (!rentalRequestId) {
            return;
        }

        loadRequest();
        loadOffers();
    }, [rentalRequestId]);

    /* =================================================
       REVIEW ACTION
    ================================================= */

    const handleReview = async (
        action: "APPROVE" | "REJECT",
    ) => {
        const isApprove = action === "APPROVE";

        if (isApprove && !riderId) {
            setActionError("Select a rider for the owner pickup before approving this rental.");
            return;
        }

        const confirmed = window.confirm(
            isApprove
                ? "Approve this rental request? The requested dates will be confirmed for this product."
                : "Reject this rental request?",
        );

        if (!confirmed) {
            return;
        }

        setActionError("");
        setSuccess("");

        try {
            setProcessing(true);

            const isApprove = action === "APPROVE";

            const payload = {
                action,

                ...(isApprove
                    ? {
                          ownerRentalFee: Number(ownerRentalFee),
                          ownerDeliveryFee: Number(ownerDeliveryFee),
                          renterRentalFee: Number(renterRentalFee),
                          renterDeliveryFee: Number(renterDeliveryFee),

                          platformCommissionRate:
                              Number(
                                  commissionRate,
                              ) >= 0
                                  ? Number(
                                        commissionRate,
                                    )
                                  : 10,

                          riderId,
                      }
                    : {}),
            };

            await reviewRentalRequest(
                rentalRequestId,
                payload,
            );

            setSuccess(
                isApprove
                    ? "Request approved. The renter has been notified."
                    : "Request rejected. The renter has been notified.",
            );

            await loadRequest();
        } catch (err) {
            console.error(
                "Failed to review rental request:",
                err,
            );

            let message =
                "Unable to review this rental request.";

            if (isAxiosError(err)) {
                const backendMessage =
                    err.response?.data?.message;

                message = Array.isArray(
                    backendMessage,
                )
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setActionError(message);
        } finally {
            setProcessing(false);
        }
    };

    /* =================================================
       CREATE ACTUAL RENTAL
    ================================================= */

    const handleCreateRental = async () => {
        const confirmed = window.confirm(
            "Create the actual rental from this approved request and create separate charge collection records for the owner and renter?",
        );

        if (!confirmed) {
            return;
        }

        setActionError("");
        setSuccess("");

        try {
            setCreatingRental(true);

            const created =
                await createActualRental(
                    rentalRequestId,
                );

            setSuccess(
                `Rental ${created.rentalId} created with separate owner and renter charge records.`,
            );

            setRental(created);
            await loadCharges();
        } catch (err) {
            console.error(
                "Failed to create actual rental:",
                err,
            );

            let message =
                "Unable to create the rental.";

            if (isAxiosError(err)) {
                const backendMessage =
                    err.response?.data?.message;

                message = Array.isArray(
                    backendMessage,
                )
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setActionError(message);
        } finally {
            setCreatingRental(false);
        }
    };

    const handleAssignNextStageRider = async () => {
        const stage = stageAssignments?.nextStage;
        if (!rental || !stage || !RIDER_HANDOFF_STAGES.includes(stage) || !nextStageRiderId) {
            setActionError("Select a rider for the next physical handoff.");
            return;
        }

        try {
            setSavingStageAssignment(true);
            setActionError("");
            setSuccess("");
            const assigned = await assignRiderToHandoverStage(
                rental.rentalId,
                stage,
                nextStageRiderId,
            );
            setStageAssignments((previous) => previous
                ? { ...previous, assignments: [...previous.assignments, assigned] }
                : previous);
            setRental((previous) => previous
                ? { ...previous, riderId: assigned.riderId }
                : previous);
            setSuccess(`${riders.find((rider) => rider.userId === assigned.riderId)?.firstName ?? "Rider"} assigned for ${HANDOFF_LABELS[stage]}. Both parties were notified.`);
        } catch (err) {
            const backendMessage = isAxiosError(err)
                ? err.response?.data?.message
                : null;
            setActionError(Array.isArray(backendMessage)
                ? backendMessage.join(", ")
                : backendMessage || "Unable to assign a rider to this handoff.");
        } finally {
            setSavingStageAssignment(false);
        }
    };

    const reloadHandoverReview = async () => {
        if (!rental?.rentalId) return;
        const [assignments, timeline] = await Promise.all([
            getHandoverRiderAssignments(rental.rentalId),
            getCustodyTimeline(rental.rentalId),
        ]);
        setStageAssignments(assignments);
        setCustodyTimeline(timeline);
        const existing = assignments.assignments
            .filter((assignment) => assignment.stage === assignments.nextStage);
        setNextStageRiderId(existing[existing.length - 1]?.riderId ?? "");
    };

    const handleWarehouseDecision = async (
        stage: HandoverStage,
        approved: boolean,
    ) => {
        if (!rental) return;
        if (!approved && !handoverReviewNote.trim()) {
            setActionError("Add a note explaining why the warehouse check failed.");
            return;
        }
        const confirmed = window.confirm(
            approved
                ? "Approve the warehouse inspection and unlock the next handoff?"
                : "Reject the warehouse inspection? The rental will remain blocked until the issue is resolved and reviewed again.",
        );
        if (!confirmed) return;

        try {
            setReviewingHandover(true);
            setActionError("");
            setSuccess("");
            await submitModeratorGate(rental.rentalId, stage, {
                approved,
                note: handoverReviewNote.trim() || undefined,
            });
            await reloadHandoverReview();
            setSuccess(approved
                ? "Warehouse inspection approved. Assign a rider to the next physical handoff."
                : "Warehouse inspection rejected. The recorded issue blocks further handoffs until reviewed again.");
            setHandoverReviewNote("");
        } catch (err) {
            const backendMessage = isAxiosError(err) ? err.response?.data?.message : null;
            setActionError(Array.isArray(backendMessage)
                ? backendMessage.join(", ")
                : backendMessage || "Unable to save the warehouse decision.");
        } finally {
            setReviewingHandover(false);
        }
    };

    const handleEarlyReturnDecision = async (approved: boolean) => {
        if (!rental) return;
        if (!approved && !handoverReviewNote.trim()) {
            setActionError("Add a note explaining why the early return was rejected.");
            return;
        }
        try {
            setReviewingHandover(true);
            setActionError("");
            setSuccess("");
            await decideEarlyReturn(rental.rentalId, {
                approved,
                note: handoverReviewNote.trim() || undefined,
            });
            await reloadHandoverReview();
            setSuccess(approved
                ? "Early return approved. The renter OTP has been sent."
                : "Early return rejected. The renter must return the product on the scheduled date.");
            setHandoverReviewNote("");
        } catch (err) {
            const backendMessage = isAxiosError(err) ? err.response?.data?.message : null;
            setActionError(Array.isArray(backendMessage)
                ? backendMessage.join(", ")
                : backendMessage || "Unable to save the early-return decision.");
        } finally {
            setReviewingHandover(false);
        }
    };

    const handleChargeReview = async (
        chargeId: string,
        approved: boolean,
    ) => {
        const confirmed = window.confirm(
            approved
                ? "Confirm that the rider collected this charge in cash?"
                : "Reject this rider collection record?",
        );
        if (!confirmed) return;

        try {
            setReviewingChargeId(chargeId);
            setActionError("");
            await reviewRentalChargeCollection(chargeId, {
                approved,
                note: chargeReviewNote.trim() || undefined,
            });
            setChargeReviewNote("");
            await loadCharges();
        } catch (err) {
            const backendMessage = isAxiosError(err)
                ? err.response?.data?.message
                : null;
            setActionError(
                Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || "Unable to review this charge collection.",
            );
        } finally {
            setReviewingChargeId(null);
        }
    };

    /* =================================================
       CONDITION REVIEW ACTIONS
    ================================================= */

    const handleConditionReview = async (
        type: "PICKUP" | "RETURN",
        conditionApproved: boolean,
    ) => {
        setActionError("");
        setSuccess("");

        try {
            setProcessing(true);

            if (type === "PICKUP") {
                await submitPickupReview(
                    rentalRequestId,
                    {
                        pickupConditionApproved:
                            conditionApproved,
                        pickupReviewNote:
                            conditionNote.trim() ||
                            undefined,
                    },
                );

                setSuccess(
                    conditionApproved
                        ? "Pickup condition review recorded: product OK."
                        : "Pickup condition review recorded: issue reported.",
                );
            } else {
                await submitReturnReview(
                    rentalRequestId,
                    {
                        returnConditionApproved:
                            conditionApproved,
                        returnReviewNote:
                            conditionNote.trim() ||
                            undefined,
                    },
                );

                setSuccess(
                    conditionApproved
                        ? "Return condition review recorded: product OK."
                        : "Return condition review recorded: issue reported.",
                );
            }

            setConditionNote("");

            await loadRequest();
        } catch (err) {
            console.error(
                "Failed to submit condition review:",
                err,
            );

            let message =
                "Unable to submit the condition review.";

            if (isAxiosError(err)) {
                const backendMessage =
                    err.response?.data?.message;

                message = Array.isArray(
                    backendMessage,
                )
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setActionError(message);
        } finally {
            setProcessing(false);
        }
    };

    /* =================================================
       RENDER
    ================================================= */

    return (
        <main className="min-h-screen bg-zinc-50">

            <ModeratorNavbar />

            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/rentals/moderator",
                        )
                    }
                    className="text-sm font-medium text-zinc-500 transition hover:text-blue-600"
                >
                    ← Back to review queue
                </button>

                {/* Loading / Error */}

                {loading && (
                    <div className="mt-6 h-64 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
                )}

                {!loading && error && (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
                        <h1 className="text-xl font-bold text-zinc-900">
                            Rental request unavailable
                        </h1>

                        <p className="mt-2 text-sm text-zinc-600">
                            {error}
                        </p>
                    </div>
                )}

                {/* Content */}

                {!loading &&
                    request && (
                        <div className="mt-4 space-y-6">

                            {/* Summary */}

                            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

                                <div className="flex flex-wrap items-start justify-between gap-3">

                                    <div>

                                        <p className="text-xs font-medium text-zinc-500">
                                            {
                                                request.rentalRequestId
                                            }
                                        </p>

                                        <h1 className="mt-1 text-2xl font-bold text-zinc-900">
                                            {request
                                                .product
                                                ?.name ??
                                                request.productId}
                                        </h1>

                                    </div>

                                    <span
                                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                            request.status ===
                                            "PRICE_AGREED"
                                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                                : request.status ===
                                                  "APPROVED"
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                : request.status ===
                                                  "REJECTED"
                                                ? "border-red-200 bg-red-50 text-red-700"
                                                : "border-zinc-200 bg-zinc-50 text-zinc-600"
                                        }`}
                                    >
                                        {
                                            request.status
                                        }
                                    </span>

                                </div>

                                <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">

                                    <div>
                                        <dt className="text-xs font-medium text-zinc-400">
                                            Renter
                                        </dt>

                                        <dd className="mt-1 font-medium text-zinc-900">
                                            {request
                                                .renter
                                                ?.email ??
                                                request.renterId}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium text-zinc-400">
                                            Owner
                                        </dt>

                                        <dd className="mt-1 font-medium text-zinc-900">
                                            {request
                                                .owner
                                                ?.email ??
                                                request.ownerId}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium text-zinc-400">
                                            Rental dates
                                        </dt>

                                        <dd className="mt-1 font-medium text-zinc-900">
                                            {formatDate(
                                                request.startDate,
                                            )}{" "}
                                            →{" "}
                                            {formatDate(
                                                request.endDate,
                                            )}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium text-zinc-400">
                                            Rental days
                                        </dt>

                                        <dd className="mt-1 font-medium text-zinc-900">
                                            {
                                                request.rentalDays
                                            }{" "}
                                            day(s)
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium text-zinc-400">
                                            Listed price
                                        </dt>

                                        <dd className="mt-1">
                                            ৳
                                            {formatPrice(
                                                request.listedPricePerDay,
                                            )}
                                            /day
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium text-zinc-400">
                                            Agreed price
                                        </dt>

                                        <dd className="mt-1 text-base font-bold text-emerald-700">
                                            ৳
                                            {formatPrice(
                                                request.agreedPricePerDay ??
                                                    request.offeredPricePerDay ??
                                                    request.listedPricePerDay,
                                            )}
                                            /day
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium text-zinc-400">
                                            Pickup address
                                        </dt>

                                        <dd className="mt-1">
                                            {request
                                                .product
                                                ?.location
                                                ?.pickupAddress ??
                                                request.pickupAddress}
                                        </dd>
                                    </div>

                                    {request.deliveryAddress && (
                                        <div>
                                            <dt className="text-xs font-medium text-zinc-400">
                                                Delivery
                                                address
                                            </dt>

                                            <dd className="mt-1">
                                                {
                                                    request.deliveryAddress
                                                }
                                            </dd>
                                        </div>
                                    )}

                                    {request.ownerRentalFee != null && (
                                        <div>
                                            <dt className="text-xs font-medium text-zinc-400">
                                                Owner charges
                                            </dt>

                                            <dd className="mt-1 font-medium text-zinc-900">
                                                Rental ৳{formatPrice(request.ownerRentalFee)} · Delivery ৳{formatPrice(request.ownerDeliveryFee ?? "0")}
                                            </dd>
                                        </div>
                                    )}

                                    {request.renterRentalFee != null && (
                                        <div>
                                            <dt className="text-xs font-medium text-zinc-400">
                                                Renter charges
                                            </dt>

                                            <dd className="mt-1 font-medium text-zinc-900">
                                                Rental ৳{formatPrice(request.renterRentalFee)} · Delivery ৳{formatPrice(request.renterDeliveryFee ?? "0")}
                                            </dd>
                                        </div>
                                    )}

                                    {request.platformCommissionRate && (
                                        <div>
                                            <dt className="text-xs font-medium text-zinc-400">
                                                Platform
                                                commission
                                                (moderator)
                                            </dt>

                                            <dd className="mt-1 font-medium text-zinc-900">
                                                {
                                                    formatPrice(
                                                        request.platformCommissionRate,
                                                    )
                                                }
                                                %
                                            </dd>
                                        </div>
                                    )}

                                </dl>

                                {request.renterMessage && (
                                    <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                                        <p className="text-xs font-medium text-zinc-400">
                                            Renter message
                                        </p>

                                        <p className="mt-1 text-sm text-zinc-700">
                                            {
                                                request.renterMessage
                                            }
                                        </p>
                                    </div>
                                )}

                            </div>

                            {/* Review Outcome (snapshot) */}

                            {(request.status ===
                                "APPROVED" ||
                                request.status ===
                                    "REJECTED") && (
                                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

                                    <h2 className="text-base font-semibold text-zinc-900">
                                        Review outcome
                                    </h2>

                                    <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2">

                                        <div>
                                            <dt className="text-xs font-medium text-zinc-400">
                                                Decision
                                            </dt>

                                            <dd className="mt-1 font-semibold">
                                                {
                                                    request.status
                                                }
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-xs font-medium text-zinc-400">
                                                Reviewed at
                                            </dt>

                                            <dd className="mt-1">
                                                {request.reviewedAt
                                                    ? formatDate(
                                                          request.reviewedAt,
                                                      )
                                                    : "—"}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-xs font-medium text-zinc-400">
                                                Reviewing
                                                moderator
                                            </dt>

                                            <dd className="mt-1">
                                                {request
                                                    .moderator
                                                    ?.email ??
                                                    request.moderatorId ??
                                                    "—"}
                                            </dd>
                                        </div>

                                    </dl>

                                </div>
                            )}

                            {/* Negotiation Audit Trail */}

                            {offers.length > 0 && (
                                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

                                    <h2 className="text-base font-semibold text-zinc-900">
                                        Negotiation history
                                    </h2>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        Price offers exchanged
                                        between the renter and
                                        the owner.
                                    </p>

                                    <ul className="mt-4 space-y-3">

                                        {offers.map(
                                            (
                                                offer,
                                            ) => (
                                                <li
                                                    key={
                                                        offer.offerId
                                                    }
                                                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4"
                                                >

                                                    <div>
                                                        <p className="text-sm font-semibold text-zinc-900">
                                                            ৳
                                                            {formatPrice(
                                                                offer.offeredPricePerDay,
                                                            )}
                                                            /day{" "}
                                                            <span className="text-xs font-normal text-zinc-500">
                                                                by{" "}
                                                                {offer
                                                                    .sender
                                                                    ?.email ??
                                                                    offer.senderId}
                                                            </span>
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-zinc-400">
                                                            {
                                                                formatDate(
                                                                    offer.createdAt,
                                                                )
                                                            }
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            offer.status ===
                                                            "PENDING"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : offer.status ===
                                                                  "ACCEPTED"
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-red-50 text-red-700"
                                                        }`}
                                                    >
                                                        {
                                                            offer.status
                                                        }
                                                    </span>

                                                </li>
                                            ),
                                        )}

                                    </ul>

                                </div>
                            )}

                            {/* Decision Panel */}

                            {(success ||
                                actionError) && (
                                <div
                                    className={`rounded-xl border p-4 text-sm ${
                                        actionError
                                            ? "border-red-200 bg-red-50 text-red-700"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    }`}
                                >
                                    {actionError ||
                                        success}
                                </div>
                            )}

                            {request.status ===
                                "PRICE_AGREED" && (
                                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

                                    <h2 className="text-base font-semibold text-zinc-900">
                                        Moderation decision
                                    </h2>

                                    <p className="mt-1 text-sm text-zinc-500">
                                        Set separate rental and
                                        delivery charges for the owner
                                        and renter, plus the platform commission
                                        (policy default: 10%),
                                        optionally assign a rider
                                        for pickup and delivery,
                                        then approve. Emails will
                                        be sent to the renter and
                                        the owner.
                                    </p>

                                    {/* Separate party charge inputs */}

                                    <div className="mt-5 grid gap-4 sm:grid-cols-2">

                                        <div>
                                            <label
                                                htmlFor="ownerRentalFee"
                                                className="text-xs font-semibold text-zinc-500"
                                            >
                                                Owner rental charge (৳)
                                            </label>

                                            <input
                                                id="ownerRentalFee"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    ownerRentalFee
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setOwnerRentalFee(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="ownerDeliveryFee" className="text-xs font-semibold text-zinc-500">
                                                Owner delivery charge (৳)
                                            </label>
                                            <input id="ownerDeliveryFee" type="number" min="0" step="0.01" value={ownerDeliveryFee} onChange={(event) => setOwnerDeliveryFee(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none" />
                                        </div>

                                        <div>
                                            <label htmlFor="renterRentalFee" className="text-xs font-semibold text-zinc-500">
                                                Renter rental charge (৳)
                                            </label>
                                            <input id="renterRentalFee" type="number" min="0" step="0.01" value={renterRentalFee} onChange={(event) => setRenterRentalFee(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none" />
                                        </div>

                                        <div>
                                            <label htmlFor="renterDeliveryFee" className="text-xs font-semibold text-zinc-500">
                                                Renter delivery charge (৳)
                                            </label>
                                            <input id="renterDeliveryFee" type="number" min="0" step="0.01" value={renterDeliveryFee} onChange={(event) => setRenterDeliveryFee(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none" />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="commissionRate"
                                                className="text-xs font-semibold text-zinc-500"
                                            >
                                                Platform
                                                commission (%)
                                            </label>

                                            <input
                                                id="commissionRate"
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={
                                                    commissionRate
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setCommissionRate(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="riderId"
                                                className="text-xs font-semibold text-zinc-500"
                                            >
                                                Assign rider for owner pickup
                                            </label>

                                            <select
                                                id="riderId"
                                                value={
                                                    riderId
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setRiderId(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                            >
                                                <option value="" disabled>
                                                    Select a rider
                                                </option>

                                                {riders.map(
                                                    (
                                                        rider,
                                                    ) => (
                                                        <option
                                                            key={
                                                                rider.userId
                                                            }
                                                            value={
                                                                rider.userId
                                                            }
                                                        >
                                                            {
                                                                rider.firstName
                                                            }{" "}
                                                            {
                                                                rider.lastName
                                                            }{" "}
                                                            (📞{" "}
                                                            {
                                                                rider.phone
                                                            }
                                                            )
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>

                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-3">

                                        <button
                                            type="button"
                                            disabled={
                                                processing
                                            }
                                            onClick={() =>
                                                handleReview(
                                                    "REJECT",
                                                )
                                            }
                                            className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Reject request
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                processing
                                            }
                                            onClick={() =>
                                                handleReview(
                                                    "APPROVE",
                                                )
                                            }
                                            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing
                                                ? "Processing..."
                                                : "Approve request"}
                                        </button>

                                    </div>

                                </div>
                            )}

                            {/* ACTUAL RENTAL (PHASE 11) */}

                            {request.status ===
                                "APPROVED" && (
                                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

                                    <h2 className="text-base font-semibold text-zinc-900">
                                        Actual rental
                                    </h2>

                                    {rental ? (
                                        <>
                                            <p className="mt-1 text-sm text-zinc-500">
                                                Created from
                                                this approved
                                                request —
                                                synchronous
                                                snapshot of
                                                schedule and
                                                money.
                                            </p>

                                            <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2">

                                                <div>
                                                    <dt className="text-xs font-medium text-zinc-400">
                                                        Rental ID
                                                    </dt>

                                                    <dd className="mt-1 font-semibold text-zinc-900">
                                                        {
                                                            rental.rentalId
                                                        }
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-xs font-medium text-zinc-400">
                                                        Status
                                                    </dt>

                                                    <dd className="mt-1">
                                                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                                            {
                                                                rental.status
                                                            }
                                                        </span>
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-xs font-medium text-zinc-400">
                                                        Rental amount
                                                        (price ×
                                                        days)
                                                    </dt>

                                                    <dd className="mt-1">
                                                        ৳
                                                        {Number(
                                                            rental.rentalAmount,
                                                        ).toFixed(
                                                            2,
                                                        )}
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-xs font-medium text-zinc-400">
                                                        Delivery fee
                                                    </dt>

                                                    <dd className="mt-1">
                                                        ৳
                                                        {Number(
                                                            rental.deliveryFee,
                                                        ).toFixed(
                                                            2,
                                                        )}
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-xs font-medium text-zinc-400">
                                                        Platform
                                                        commission
                                                    </dt>

                                                    <dd className="mt-1">
                                                        ৳
                                                        {Number(
                                                            rental.platformCommissionAmount,
                                                        ).toFixed(
                                                            2,
                                                        )}
                                                        {" ("}
                                                        {Number(
                                                            rental.platformCommissionRate,
                                                        ).toFixed(
                                                            2,
                                                        )}
                                                        %)
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-xs font-medium text-zinc-400">
                                                        Total
                                                        payable
                                                        (renter)
                                                    </dt>

                                                    <dd className="mt-1 text-base font-bold text-emerald-700">
                                                        ৳
                                                        {Number(
                                                            rental.totalPayable,
                                                        ).toFixed(
                                                            2,
                                                        )}
                                                    </dd>
                                                </div>

                                            </dl>

                                            {stageAssignments && (
                                                <section className="mt-6 border-t border-zinc-100 pt-5">
                                                    <h3 className="text-sm font-semibold text-zinc-900">Rider assignment by handoff</h3>
                                                    <p className="mt-1 text-xs leading-5 text-zinc-500">Select a rider separately for each physical transfer. Assignment locks once evidence is submitted for that handoff.</p>

                                                    {stageAssignments.nextStage === null ? (
                                                        <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">All custody stages are complete.</p>
                                                    ) : !RIDER_HANDOFF_STAGES.includes(stageAssignments.nextStage) ? (
                                                        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Next: {HANDOFF_LABELS[stageAssignments.nextStage]}. Moderator approval is required; assign the rider for the next physical handoff afterward.</p>
                                                    ) : (
                                                        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Next handoff · {HANDOFF_LABELS[stageAssignments.nextStage]}</p>
                                                            {stageAssignments.assignmentLocked ? (
                                                                <p className="mt-2 text-sm text-zinc-700">
                                                                    Assigned rider: {riders.find((rider) => rider.userId === (stageAssignments.assignments.filter((assignment) => assignment.stage === stageAssignments.nextStage).at(-1)?.riderId))?.firstName ?? "Selected rider"}. Assignment is locked because this handoff has started.
                                                                </p>
                                                            ) : (
                                                                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                                                                    <label className="flex-1 text-xs font-semibold text-zinc-600">
                                                                        Select rider
                                                                        <select value={nextStageRiderId} onChange={(event) => setNextStageRiderId(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-normal text-zinc-900">
                                                                            <option value="">Choose a rider</option>
                                                                            {riders.map((rider) => <option key={rider.userId} value={rider.userId}>{rider.firstName} {rider.lastName} · {rider.phone}</option>)}
                                                                        </select>
                                                                    </label>
                                                                    <button type="button" disabled={savingStageAssignment || !nextStageRiderId} onClick={() => void handleAssignNextStageRider()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                                                                        {savingStageAssignment ? "Assigning…" : "Assign rider"}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {stageAssignments.assignments.length > 0 && (
                                                        <div className="mt-4">
                                                            <p className="text-xs font-semibold text-zinc-500">Assignment history</p>
                                                            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                                                                {stageAssignments.assignments.map((assignment) => {
                                                                    const assignedRider = riders.find((rider) => rider.userId === assignment.riderId);
                                                                    return (
                                                                        <li key={assignment.assignmentId} className="rounded-lg border border-zinc-100 px-3 py-2 text-xs">
                                                                            <span className="font-medium text-zinc-700">{HANDOFF_LABELS[assignment.stage]}</span>
                                                                            <span className="mt-1 block text-zinc-500">{assignedRider ? `${assignedRider.firstName} ${assignedRider.lastName}` : assignment.riderId} · {formatDate(assignment.assignedAt)}</span>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </section>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <p className="mt-1 text-sm text-zinc-500">
                                                No actual
                                                rental has been
                                                created for this
                                                request yet.
                                                Creating it locks
                                                the booking with
                                                the stored
                                                delivery fee and
                                                commission and
                                                performs a final
                                                overlap check.
                                            </p>

                                            <button
                                                type="button"
                                                disabled={
                                                    creatingRental
                                                }
                                                onClick={
                                                    handleCreateRental
                                                }
                                                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {creatingRental
                                                    ? "Creating..."
                                                    : "Create actual rental"}
                                            </button>
                                        </>
                                    )}

                                </div>
                            )}

                            {rental && custodyTimeline && stageAssignments && (
                                <>
                                    {(stageAssignments.nextStage === "WAREHOUSE_IN" || stageAssignments.nextStage === "RETURN_WAREHOUSE_IN") && (() => {
                                        const gateStage = stageAssignments.nextStage as HandoverStage;
                                        const evidenceStage: HandoverStage = gateStage === "WAREHOUSE_IN" ? "OWNER_HANDOVER" : "RETURN_PICKUP";
                                        const evidenceCheckpoint = custodyTimeline.checkpoints.find((checkpoint) => checkpoint.stage === evidenceStage);
                                        const gateCheckpoint = custodyTimeline.checkpoints.find((checkpoint) => checkpoint.stage === gateStage);
                                        return (
                                            <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
                                                <h2 className="text-base font-semibold text-zinc-900">Moderator warehouse inspection</h2>
                                                <p className="mt-1 text-sm text-zinc-600">Review the rider&apos;s evidence from {HANDOFF_LABELS[evidenceStage].toLowerCase()}, then approve the product at the warehouse or reject with an issue note.</p>
                                                {evidenceCheckpoint && (
                                                    <div className="mt-4 rounded-xl bg-zinc-50 p-4">
                                                        <p className="text-xs font-semibold text-zinc-700">Rider evidence · {evidenceCheckpoint.actor.name || "Assigned rider"} · {formatDate(evidenceCheckpoint.verifiedAt ?? evidenceCheckpoint.createdAt)}</p>
                                                        {evidenceCheckpoint.note && <p className="mt-2 text-sm text-zinc-600">{evidenceCheckpoint.note}</p>}
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {evidenceCheckpoint.media.map((media, index) => media.mediaType === "VIDEO" ? (
                                                                <video key={media.fileUrl} controls preload="metadata" className="h-28 w-40 rounded-lg border border-zinc-200 object-cover" src={media.fileUrl} />
                                                            ) : (
                                                                <a key={`${media.fileUrl}-${index}`} href={media.fileUrl} target="_blank" rel="noreferrer">
                                                                    <img alt={`Rider evidence ${index + 1}`} src={media.fileUrl} className="h-28 w-40 rounded-lg border border-zinc-200 object-cover" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {gateCheckpoint?.status === "REJECTED" && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">Previously rejected: {gateCheckpoint.note || "No note saved."} You may review again after resolving the issue.</p>}
                                                <label className="mt-4 block text-xs font-semibold text-zinc-600">
                                                    Inspection note {gateCheckpoint?.status === "REJECTED" ? "(required to reject again)" : "(required when rejecting)"}
                                                    <textarea value={handoverReviewNote} onChange={(event) => setHandoverReviewNote(event.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-normal text-zinc-900" placeholder="Record the warehouse condition or issue found." />
                                                </label>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button type="button" disabled={reviewingHandover} onClick={() => void handleWarehouseDecision(gateStage, true)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve warehouse check</button>
                                                    <button type="button" disabled={reviewingHandover} onClick={() => void handleWarehouseDecision(gateStage, false)} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Reject and block next handoff</button>
                                                </div>
                                            </section>
                                        );
                                    })()}

                                    {(() => {
                                        const earlyReturnCheckpoint = custodyTimeline.checkpoints.find((checkpoint) => checkpoint.stage === "RETURN_PICKUP" && checkpoint.isEarlyReturn && checkpoint.earlyReturnApproved === null && checkpoint.status === "PENDING");
                                        if (!earlyReturnCheckpoint) return null;
                                        return (
                                            <section className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8">
                                                <h2 className="text-base font-semibold text-zinc-900">Early return request</h2>
                                                <p className="mt-1 text-sm text-zinc-600">Review the renter&apos;s return-pickup evidence before allowing OTP verification.</p>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {earlyReturnCheckpoint.media.map((media, index) => media.mediaType === "VIDEO" ? (
                                                        <video key={media.fileUrl} controls preload="metadata" className="h-28 w-40 rounded-lg border border-zinc-200 object-cover" src={media.fileUrl} />
                                                    ) : (
                                                        <a key={`${media.fileUrl}-${index}`} href={media.fileUrl} target="_blank" rel="noreferrer">
                                                            <img alt={`Early return evidence ${index + 1}`} src={media.fileUrl} className="h-28 w-40 rounded-lg border border-zinc-200 object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                                <label className="mt-4 block text-xs font-semibold text-zinc-600">Decision note (required when rejecting)<textarea value={handoverReviewNote} onChange={(event) => setHandoverReviewNote(event.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-normal text-zinc-900" placeholder="Add a note for the renter." /></label>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button type="button" disabled={reviewingHandover} onClick={() => void handleEarlyReturnDecision(true)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve early return</button>
                                                    <button type="button" disabled={reviewingHandover} onClick={() => void handleEarlyReturnDecision(false)} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Reject early return</button>
                                                </div>
                                            </section>
                                        );
                                    })()}
                                </>
                            )}

                            {rental && charges.length > 0 && (
                                <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
                                    <h2 className="text-base font-semibold text-zinc-900">Party charge collections</h2>
                                    <p className="mt-1 text-sm text-zinc-500">Review cash collection records submitted by the assigned rider.</p>
                                    <div className="mt-4 divide-y divide-zinc-100">
                                        {charges.map((charge) => (
                                            <div key={charge.chargeId} className="py-4">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium text-zinc-900">{charge.payerRole} · {charge.type} charge</p>
                                                        <p className="mt-1 text-sm text-zinc-600">৳{Number(charge.amount).toFixed(2)} · {charge.paymentMethod ?? "No collection recorded"}</p>
                                                        {charge.collectedAt && <p className="mt-1 text-xs text-zinc-400">Collected {new Date(charge.collectedAt).toLocaleString()}</p>}
                                                    </div>
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${charge.status === "CONFIRMED" || charge.status === "NO_CHARGE" ? "bg-emerald-50 text-emerald-700" : charge.status === "REJECTED" ? "bg-red-50 text-red-700" : charge.status === "SUBMITTED" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                                                        {charge.status.replace(/_/g, " ")}
                                                    </span>
                                                </div>

                                                {charge.status === "SUBMITTED" && (
                                                    <div className="mt-3 rounded-xl bg-zinc-50 p-4">
                                                        <label htmlFor={`charge-note-${charge.chargeId}`} className="text-xs font-medium text-zinc-500">Review note (optional)</label>
                                                        <textarea id={`charge-note-${charge.chargeId}`} value={chargeReviewNote} onChange={(event) => setChargeReviewNote(event.target.value)} maxLength={1000} rows={2} className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900" />
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <button type="button" disabled={reviewingChargeId !== null} onClick={() => void handleChargeReview(charge.chargeId, true)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{reviewingChargeId === charge.chargeId ? "Saving…" : "Confirm collection"}</button>
                                                            <button type="button" disabled={reviewingChargeId !== null} onClick={() => void handleChargeReview(charge.chargeId, false)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Reject record</button>
                                                        </div>
                                                    </div>
                                                )}

                                                {charge.verificationNote && <p className="mt-2 text-xs text-zinc-500">Moderator note: {charge.verificationNote}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* RECEIVING (PICKUP) CONDITION REVIEW */}

                            {request.status ===
                                "APPROVED" && (
                                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

                                    <h2 className="text-base font-semibold text-zinc-900">
                                        Receiving review (pickup)
                                    </h2>

                                    <p className="mt-1 text-sm text-zinc-500">
                                        Confirm the product
                                        condition when the rider
                                        picks it up for
                                        delivery/handover.
                                    </p>

                                    {request.moderatorPickupReviewedAt ? (
                                        <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
                                            <p
                                                className={`font-semibold ${
                                                    request.pickupConditionApproved
                                                        ? "text-emerald-700"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {request.pickupConditionApproved
                                                    ? "Condition approved at pickup"
                                                    : "Issue reported at pickup"}
                                            </p>

                                            <p className="mt-1 text-xs text-zinc-500">
                                                {formatDate(
                                                    request.moderatorPickupReviewedAt,
                                                )}
                                            </p>

                                            {request.pickupReviewNote && (
                                                <p className="mt-2 text-zinc-700">
                                                    {
                                                        request.pickupReviewNote
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-4">

                                            <textarea
                                                rows={2}
                                                placeholder="Condition notes (optional)"
                                                value={
                                                    conditionNote
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setConditionNote(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                            />

                                            <div className="mt-3 flex flex-wrap gap-3">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        processing
                                                    }
                                                    onClick={() =>
                                                        handleConditionReview(
                                                            "PICKUP",
                                                            true,
                                                        )
                                                    }
                                                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Product OK at
                                                    pickup
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        processing
                                                    }
                                                    onClick={() =>
                                                        handleConditionReview(
                                                            "PICKUP",
                                                            false,
                                                        )
                                                    }
                                                    className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Report issue
                                                </button>
                                            </div>

                                        </div>
                                    )}

                                </div>
                            )}

                            {/* RETURN CONDITION REVIEW */}

                            {request.status ===
                                "APPROVED" &&
                                request.moderatorPickupReviewedAt && (
                                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

                                        <h2 className="text-base font-semibold text-zinc-900">
                                            Return review (after
                                            rental term)
                                        </h2>

                                        <p className="mt-1 text-sm text-zinc-500">
                                            The moderator checks
                                            the product condition
                                            again after the rental
                                            term ends (
                                            {formatDate(
                                                request.endDate,
                                            )}
                                            ).
                                        </p>

                                        {request.moderatorReturnReviewedAt ? (
                                            <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
                                                <p
                                                    className={`font-semibold ${
                                                        request.returnConditionApproved
                                                            ? "text-emerald-700"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {request.returnConditionApproved
                                                        ? "Condition approved at return"
                                                        : "Issue reported at return"}
                                                </p>

                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {formatDate(
                                                        request.moderatorReturnReviewedAt,
                                                    )}
                                                </p>

                                                {request.returnReviewNote && (
                                                    <p className="mt-2 text-zinc-700">
                                                        {
                                                            request.returnReviewNote
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-4">

                                                <textarea
                                                    rows={2}
                                                    placeholder="Condition notes (optional)"
                                                    value={
                                                        conditionNote
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setConditionNote(
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none"
                                                />

                                                <div className="mt-3 flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            processing
                                                        }
                                                        onClick={() =>
                                                            handleConditionReview(
                                                                "RETURN",
                                                                true,
                                                            )
                                                        }
                                                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Product OK at
                                                        return
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            processing
                                                        }
                                                        onClick={() =>
                                                            handleConditionReview(
                                                                "RETURN",
                                                                false,
                                                            )
                                                        }
                                                        className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Report issue
                                                    </button>
                                                </div>

                                            </div>
                                        )}

                                    </div>
                                )}

                        </div>
                    )}

            </div>

        </main>
    );
}
