"use client";

import { useCallback, useEffect, useState } from "react";

import {
    getCustodyTimeline,
    type CustodyTimeline,
    type HandoverCheckpoint,
    type HandoverStage,
} from "@/app/lib/handover-api";

/* =========================================================
   CHAIN OF CUSTODY TIMELINE
   Shared component — rendered on the rental request
   details page so BOTH the owner and the renter see
   the same track (the rider and moderators see it too).
========================================================= */

/* ---- Stage presentation ---- */

const STAGE_ORDER: HandoverStage[] = [
    "OWNER_HANDOVER",
    "WAREHOUSE_IN",
    "DELIVERED_TO_RENTER",
    "RETURN_PICKUP",
    "RETURN_WAREHOUSE_IN",
    "OWNER_RETURN",
];

const STAGE_META: Record<
    HandoverStage,
    {
        label: string;
        icon: string;
        description: string;
        leg: 1 | 2;
    }
> = {
    OWNER_HANDOVER: {
        label: "Picked up from owner",
        icon: "🏠",
        description:
            "The rider collected the product from the owner with photo/video evidence and the owner's verification code.",
        leg: 1,
    },
    WAREHOUSE_IN: {
        label: "Warehouse check",
        icon: "🏬",
        description:
            "A moderator inspected the product at the warehouse. Verified with the moderator's ID.",
        leg: 1,
    },
    DELIVERED_TO_RENTER: {
        label: "Delivered to renter",
        icon: "📦",
        description:
            "The rider delivered the product to the renter. Verified with the code sent to the renter's email.",
        leg: 1,
    },
    RETURN_PICKUP: {
        label: "Return picked up",
        icon: "🔄",
        description:
            "The rider collected the product from the renter with photo/video evidence and the renter's verification code.",
        leg: 2,
    },
    RETURN_WAREHOUSE_IN: {
        label: "Return warehouse check",
        icon: "🏬",
        description:
            "A moderator re-inspected the returned product at the warehouse.",
        leg: 2,
    },
    OWNER_RETURN: {
        label: "Returned to owner",
        icon: "✅",
        description:
            "The rider returned the product to the owner. Verified with the code sent to the owner's email.",
        leg: 2,
    },
};

/* ---- Helpers ---- */

function formatDateTime(date?: string | null) {
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

function formatRentalDate(date: string) {
    return new Date(date).toLocaleDateString("en-BD", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Dhaka",
    });
}

/* ---- Component ---- */

export default function CustodyTimeline({
    rentalId,
}: {
    rentalId: string;
}) {
    const [timeline, setTimeline] =
        useState<CustodyTimeline | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const loadTimeline = useCallback(async () => {
        if (!rentalId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const data =
                await getCustodyTimeline(rentalId);

            setTimeline(data);
        } catch (err: any) {
            console.error(
                "Failed to load custody timeline:",
                err,
            );

            /*
             * A rental may not exist yet (the
             * moderator creates it after approval).
             * That is not an error — we just hide
             * the timeline.
             */

            if (
                err?.response?.status !== 404
            ) {
                setError(
                    err?.response?.data?.message ||
                        "Unable to load the custody track.",
                );
            } else {
                setTimeline(null);
            }
        } finally {
            setLoading(false);
        }
    }, [rentalId]);

    useEffect(() => {
        loadTimeline();
    }, [loadTimeline]);

    /* ---- Loading ---- */

    if (loading) {
        return (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-950">
                        Chain of custody
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Track every handover step.
                    </p>
                </div>

                <div className="space-y-3 p-5">
                    <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                </div>
            </section>
        );
    }

    /* ---- No rental yet → hidden ---- */

    if (!timeline) {
        return null;
    }

    /* ---- Error ---- */

    if (error) {
        return (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-amber-800">
                    {error}
                </p>

                <button
                    type="button"
                    onClick={loadTimeline}
                    className="mt-3 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                    Retry
                </button>
            </section>
        );
    }

    /* ---- Render ---- */

    const checkpointByStage = new Map<
        HandoverStage,
        HandoverCheckpoint
    >(
        timeline.checkpoints.map((checkpoint) => [
            checkpoint.stage,
            checkpoint,
        ]),
    );
    const deliveryWasConfirmed = checkpointByStage.get("DELIVERED_TO_RENTER")?.status === "VERIFIED";

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* HEADER */}

            <div className="border-b border-slate-100 px-5 py-4">

                <div className="flex flex-wrap items-center justify-between gap-3">

                    <div>
                        <h2 className="text-base font-semibold text-slate-950">
                            Chain of custody
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Every handover step with
                            photo/video evidence and
                            verification codes.
                        </p>
                    </div>

                    <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                            timeline.complete
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                    >
                        {timeline.complete
                            ? "Custody complete"
                            : `In progress · ${timeline.rentalStatus.replace("_", " ")}`}
                    </span>

                </div>
            </div>

            <div className="p-5">

                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        {deliveryWasConfirmed ? "Actual rental dates" : "Planned rental dates"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatRentalDate(timeline.startDate)} – {formatRentalDate(timeline.endDate)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                        {deliveryWasConfirmed
                            ? `Rental day 1 starts ${formatRentalDate(timeline.startDate)}, the day after receipt was confirmed.`
                            : "Rental day counting starts the day after the renter confirms receipt by OTP."}
                    </p>
                </div>

                {(["LEG 1 — Owner to renter", "LEG 2 — Renter back to owner"] as const).map(
                    (legLabel, legIndex) => {
                        const leg = (legIndex + 1) as 1 | 2;

                        return (
                            <div
                                key={legLabel}
                                className={legIndex === 1 ? "mt-6" : ""}
                            >
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                    {legLabel}
                                </p>

                                <ol className="mt-3 space-y-3">

                                    {STAGE_ORDER.filter(
                                        (stage) =>
                                            STAGE_META[stage].leg === leg,
                                    ).map((stage) => {
                                        const checkpoint =
                                            checkpointByStage.get(stage);

                                        const meta =
                                            STAGE_META[stage];

                                        const isVerified =
                                            checkpoint?.status ===
                                            "VERIFIED";

                                        const isRejected =
                                            checkpoint?.status ===
                                            "REJECTED";

                                        const isPending =
                                            checkpoint?.status ===
                                            "PENDING";

                                        const isNext =
                                            timeline.nextStage ===
                                            stage;

                                        return (
                                            <li
                                                key={stage}
                                                className={`rounded-xl border p-4 ${
                                                    isVerified
                                                        ? "border-emerald-200 bg-emerald-50/50"
                                                        : isRejected
                                                          ? "border-red-200 bg-red-50/50"
                                                          : isNext
                                                            ? "border-blue-300 bg-blue-50/60 ring-1 ring-blue-200"
                                                            : "border-slate-200 bg-slate-50"
                                                }`}
                                        >

                                            <div className="flex items-start gap-3">

                                                {/* ICON / STATUS MARK */}

                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                                                        isVerified
                                                            ? "bg-emerald-100"
                                                            : isRejected
                                                              ? "bg-red-100"
                                                              : "bg-white shadow-sm"
                                                    }`}
                                                >
                                                    {isVerified
                                                        ? "✓"
                                                        : isRejected
                                                          ? "✕"
                                                          : meta.icon}
                                                </div>

                                                <div className="min-w-0 flex-1">

                                                    <div className="flex flex-wrap items-center justify-between gap-2">

                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {
                                                                meta.label
                                                            }
                                                        </p>

                                                        <span
                                                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                                                isVerified
                                                                    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                                                    : isRejected
                                                                      ? "border-red-200 bg-red-100 text-red-700"
                                                                      : isPending
                                                                        ? "border-amber-200 bg-amber-100 text-amber-700"
                                                                        : "border-slate-200 bg-white text-slate-500"
                                                            }`}
                                                        >
                                                            {isVerified
                                                                ? "Verified"
                                                                : isRejected
                                                                  ? "Rejected"
                                                                  : isPending
                                                                    ? "Waiting"
                                                                    : "Not started"}
                                                        </span>

                                                    </div>

                                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                                        {
                                                            meta.description
                                                        }
                                                    </p>

                                                    {/* EARLY RETURN BADGE */}

                                                    {checkpoint?.isEarlyReturn && (
                                                        <p
                                                            className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                                                checkpoint.earlyReturnApproved ===
                                                                true
                                                                    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                                                    : checkpoint.earlyReturnApproved ===
                                                                        false
                                                                      ? "border-red-200 bg-red-100 text-red-700"
                                                                      : "border-amber-200 bg-amber-100 text-amber-700"
                                                            }`}
                                                        >
                                                            ⏱ Early return
                                                            {checkpoint.earlyReturnApproved ===
                                                            true
                                                                ? " · approved"
                                                                : checkpoint.earlyReturnApproved ===
                                                                    false
                                                                  ? " · rejected"
                                                                  : " · awaiting moderator"}
                                                        </p>
                                                    )}

                                                    {/* ACTOR + TIMESTAMP */}

                                                    {(isVerified ||
                                                        isPending ||
                                                        isRejected) && (
                                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">

                                                            {checkpoint?.actor?.name && (
                                                                <span>
                                                                    By:{" "}
                                                                    <span className="font-medium text-slate-700">
                                                                        {
                                                                            checkpoint
                                                                                .actor
                                                                                .name
                                                                        }
                                                                    </span>
                                                                </span>
                                                            )}

                                                            {checkpoint?.verifiedBy && (
                                                                <span>
                                                                    Verified by:{" "}
                                                                    <span className="font-medium text-slate-700">
                                                                        {
                                                                            checkpoint
                                                                                .verifiedBy
                                                                                .name
                                                                        }
                                                                        {checkpoint
                                                                            .verifiedBy
                                                                            .role ===
                                                                        "MODERATOR"
                                                                            ? " (Moderator)"
                                                                            : ""}
                                                                    </span>
                                                                </span>
                                                            )}

                                                            <span>
                                                                {checkpoint?.verifiedAt
                                                                    ? formatDateTime(
                                                                          checkpoint.verifiedAt,
                                                                      )
                                                                    : formatDateTime(
                                                                          checkpoint?.createdAt,
                                                                      )}
                                                            </span>

                                                        </div>
                                                    )}

                                                    {/* NOTE */}

                                                    {checkpoint?.note && (
                                                        <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-xs leading-5 text-slate-600">
                                                            📝{" "}
                                                            {
                                                                checkpoint.note
                                                            }
                                                        </p>
                                                    )}

                                                    {/* MEDIA EVIDENCE */}

                                                    {checkpoint &&
                                                        checkpoint.media
                                                            .length >
                                                            0 && (
                                                            <div className="mt-3">

                                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                                                    Evidence
                                                                </p>

                                                                <div className="mt-2 flex flex-wrap gap-2">

                                                                    {checkpoint.media.map((media, index) => {
                                                                        if (media.mediaType === "VIDEO") {
                                                                            return (
                                                                                <video
                                                                                    key={media.fileUrl}
                                                                                    controls
                                                                                    preload="metadata"
                                                                                    className="h-24 w-32 rounded-lg border border-slate-200 object-cover"
                                                                                    src={media.fileUrl}
                                                                                />
                                                                            );
                                                                        }

                                                                        return (
                                                                            <a
                                                                                key={`${media.fileUrl}-${index}`}
                                                                                href={media.fileUrl}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                            >
                                                                                <img
                                                                                    src={media.fileUrl}
                                                                                    alt={`Evidence ${index + 1}`}
                                                                                    className="h-24 w-32 rounded-lg border border-slate-200 object-cover transition hover:opacity-90"
                                                                                />
                                                                            </a>
                                                                        );
                                                                    })}

                                                                </div>
                                                            </div>
                                                        )}

                                                </div>
                                            </div>
                                        </li>
                                        );
                                    })}

                                </ol>
                            </div>
                        );
                    },
                )}
            </div>
        </section>
    );
}
