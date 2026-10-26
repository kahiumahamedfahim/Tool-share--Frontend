"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import RiderNavbar from "@/app/components/rider/RiderNavbar";
import {
    getHandoverErrorMessage,
    getMyHandoverTasks,
    resendHandoverOtp,
    submitHandoverMedia,
    verifyHandoverOtp,
    type HandoverStage,
    type RiderHandoverTask,
} from "@/app/lib/handover-api";

const RIDER_STAGES = new Set<HandoverStage>([
    "OWNER_HANDOVER",
    "DELIVERED_TO_RENTER",
    "RETURN_PICKUP",
    "OWNER_RETURN",
]);

const stageParty = (stage: HandoverStage) => {
    if (stage === "OWNER_HANDOVER" || stage === "OWNER_RETURN") return "owner";
    if (stage === "DELIVERED_TO_RENTER" || stage === "RETURN_PICKUP") return "renter";
    return null;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
});

const validateEvidence = (files: File[]) => {
    const photoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const photos = files.filter((file) => photoTypes.has(file.type));
    const videos = files.filter((file) => file.type === "video/mp4");
    if (files.length === 0) return "Choose at least one photo as handover evidence.";
    if (photos.length < 1) return "At least one photo is required.";
    if (photos.length > 6) return "You can attach up to six photos.";
    if (videos.length > 1) return "You can attach at most one MP4 video.";
    if (photos.length + videos.length !== files.length) return "Use JPEG, PNG, WebP photos or one MP4 video.";
    if (files.some((file) => file.size > 20 * 1024 * 1024)) return "Each file must be 20 MB or smaller.";
    return "";
};

export default function RiderHandoverTasksPage() {
    const [tasks, setTasks] = useState<RiderHandoverTask[]>([]);
    const [filesByRental, setFilesByRental] = useState<Record<string, File[]>>({});
    const [codesByRental, setCodesByRental] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [busyRentalId, setBusyRentalId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setTasks(await getMyHandoverTasks());
        } catch (caught) {
            setError(getHandoverErrorMessage(caught, "Unable to load your handover tasks."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadTasks();
    }, [loadTasks]);

    const runTaskAction = async (
        rentalId: string,
        action: () => Promise<unknown>,
        successMessage: string,
    ) => {
        try {
            setBusyRentalId(rentalId);
            setError("");
            setSuccess("");
            await action();
            setSuccess(successMessage);
            await loadTasks();
        } catch (caught) {
            setError(getHandoverErrorMessage(caught, "Unable to complete this handover step."));
        } finally {
            setBusyRentalId(null);
        }
    };

    const handleEvidenceUpload = async (task: RiderHandoverTask) => {
        const files = filesByRental[task.rentalId] ?? [];
        const validationError = validateEvidence(files);
        if (validationError) {
            setError(validationError);
            return;
        }
        await runTaskAction(
            task.rentalId,
            () => submitHandoverMedia(task.rentalId, task.nextStage, files),
            "Evidence uploaded. If moderator approval is required, the party's OTP will be sent after approval.",
        );
        setFilesByRental((previous) => ({ ...previous, [task.rentalId]: [] }));
    };

    const handleVerify = async (task: RiderHandoverTask) => {
        const code = codesByRental[task.rentalId] ?? "";
        if (!/^\d{6}$/.test(code)) {
            setError("Enter the six-digit OTP provided by the party.");
            return;
        }
        await runTaskAction(
            task.rentalId,
            () => verifyHandoverOtp(task.rentalId, task.nextStage, code),
            "OTP verified. The next custody step is now available.",
        );
        setCodesByRental((previous) => ({ ...previous, [task.rentalId]: "" }));
    };

    const handleResend = async (task: RiderHandoverTask) => {
        await runTaskAction(
            task.rentalId,
            () => resendHandoverOtp(task.rentalId, task.nextStage),
            "A replacement OTP has been sent to the responsible party.",
        );
    };

    return (
        <main className="min-h-screen bg-zinc-50">
            <RiderNavbar />
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    <p className="text-sm font-semibold text-blue-700">Rider workflow</p>
                    <h1 className="mt-1 text-2xl font-bold text-zinc-900 sm:text-3xl">Handover tasks</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                        Complete only the next unlocked step for each rental. Rider handovers need photo evidence and the owner&apos;s or renter&apos;s OTP; warehouse checks are completed by a moderator.
                    </p>
                </header>

                {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
                {success && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}

                <section className="mt-6 space-y-4">
                    {loading ? (
                        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">Loading handover tasks…</div>
                    ) : tasks.length === 0 ? (
                        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
                            <h2 className="font-semibold text-zinc-900">No active handovers</h2>
                            <p className="mt-1 text-sm text-zinc-500">Rentals assigned to you will appear here when a custody step is ready.</p>
                        </div>
                    ) : tasks.map((task) => {
                        const stage = task.nextStage;
                        const partyRole = stageParty(stage);
                        const party = partyRole === "owner" ? task.owner : task.renter;
                        const pending = task.pendingCheckpoint?.stage === stage;
                        const earlyReturnWaiting = pending && task.pendingCheckpoint?.isEarlyReturn && (
                            task.pendingCheckpoint.earlyReturnApproved === null ||
                            (task.pendingCheckpoint.earlyReturnApproved === false && Date.now() < new Date(task.endDate).getTime())
                        );
                        const riderStage = RIDER_STAGES.has(stage);

                        return (
                            <article key={task.rentalId} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{task.nextStageLabel}</p>
                                        <h2 className="mt-1 text-lg font-semibold text-zinc-900">{task.product?.name ?? "Rental product"}</h2>
                                        <p className="mt-1 text-sm text-zinc-600">Rental {task.rentalId} · {task.status.replace(/_/g, " ")}</p>
                                    </div>
                                    <Link href={`/rentals/request/${task.rentalRequestId}`} className="text-sm font-medium text-blue-700 hover:text-blue-800">Open rental details</Link>
                                </div>

                                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                                    <div><dt className="text-xs text-zinc-400">Rental dates</dt><dd className="mt-1 text-zinc-700">{formatDate(task.startDate)} – {formatDate(task.endDate)}</dd></div>
                                    <div><dt className="text-xs text-zinc-400">Owner</dt><dd className="mt-1 text-zinc-700">{task.owner?.name ?? "—"}{task.owner?.email ? ` · ${task.owner.email}` : ""}</dd></div>
                                    <div><dt className="text-xs text-zinc-400">Renter</dt><dd className="mt-1 text-zinc-700">{task.renter?.name ?? "—"}{task.renter?.email ? ` · ${task.renter.email}` : ""}</dd></div>
                                    <div><dt className="text-xs text-zinc-400">Pickup address</dt><dd className="mt-1 text-zinc-700">{task.pickupAddress}</dd></div>
                                    <div><dt className="text-xs text-zinc-400">Delivery address</dt><dd className="mt-1 text-zinc-700">{task.deliveryAddress}</dd></div>
                                    <div><dt className="text-xs text-zinc-400">Contact phone</dt><dd className="mt-1 text-zinc-700">{task.contactPhone}</dd></div>
                                </dl>

                                <div className="mt-5 border-t border-zinc-100 pt-4">
                                    {!riderStage ? (
                                        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">This is a warehouse inspection step. Wait for the moderator to approve it; the next rider step will unlock afterward.</p>
                                    ) : pending ? (
                                        earlyReturnWaiting ? (
                                            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{task.pendingCheckpoint?.earlyReturnApproved === false ? "The early return was rejected. Wait until the scheduled rental end date; then resend the renter OTP to continue the normal return." : "Evidence is recorded. The early return is waiting for moderator approval before the renter OTP can be used."}</p>
                                        ) : (
                                            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                                                <label className="block text-sm font-medium text-zinc-700">
                                                    {partyRole === "owner" ? "Owner" : "Renter"} OTP
                                                    <input
                                                        inputMode="numeric"
                                                        autoComplete="one-time-code"
                                                        maxLength={6}
                                                        value={codesByRental[task.rentalId] ?? ""}
                                                        onChange={(event) => setCodesByRental((previous) => ({ ...previous, [task.rentalId]: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                                                        placeholder="6-digit code"
                                                        className="mt-1 block w-full rounded-xl border border-zinc-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                    />
                                                    <span className="mt-1 block text-xs font-normal text-zinc-500">{party?.email ? `Code sent to ${party.email}` : `Enter the code from the ${partyRole}'s email.`}</span>
                                                </label>
                                                <button type="button" disabled={busyRentalId !== null} onClick={() => void handleResend(task)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">Resend OTP</button>
                                                <button type="button" disabled={busyRentalId !== null} onClick={() => void handleVerify(task)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busyRentalId === task.rentalId ? "Verifying…" : "Verify OTP"}</button>
                                            </div>
                                        )
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-800">Upload handover evidence</p>
                                                <p className="mt-1 text-xs leading-5 text-zinc-500">At least one photo is required; up to six photos and one MP4 video. The {partyRole} will receive an OTP by email.</p>
                                            </div>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/jpeg,image/png,image/webp,video/mp4"
                                                onChange={(event) => setFilesByRental((previous) => ({ ...previous, [task.rentalId]: Array.from(event.target.files ?? []) }))}
                                                className="block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700"
                                            />
                                            {(filesByRental[task.rentalId] ?? []).length > 0 && <p className="text-xs text-zinc-500">Selected: {(filesByRental[task.rentalId] ?? []).map((file) => file.name).join(", ")}</p>}
                                            <button type="button" disabled={busyRentalId !== null} onClick={() => void handleEvidenceUpload(task)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busyRentalId === task.rentalId ? "Uploading…" : "Upload evidence and request OTP"}</button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </section>
            </div>
        </main>
    );
}
