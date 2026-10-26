"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";

import RiderNavbar from "@/app/components/rider/RiderNavbar";
import {
    getMyRentalChargeTasks,
    recordRentalChargeCollection,
    type RiderChargeCollectionTask,
} from "@/app/lib/rental-api";

const money = (value: string) => Number(value ?? 0).toFixed(2);

export default function RiderChargeTasksPage() {
    const [tasks, setTasks] = useState<RiderChargeCollectionTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [busyChargeId, setBusyChargeId] = useState<string | null>(null);

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setTasks(await getMyRentalChargeTasks());
        } catch (caught) {
            const backendMessage = isAxiosError(caught)
                ? caught.response?.data?.message
                : null;
            setError(
                Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || "Unable to load charge collection tasks.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadTasks();
    }, [loadTasks]);

    const handleCollection = async (task: RiderChargeCollectionTask) => {
        const confirmed = window.confirm(
            `Confirm you collected ৳${money(task.amount)} cash from ${task.payerName}?`,
        );
        if (!confirmed) return;

        try {
            setBusyChargeId(task.chargeId);
            setError("");
            setSuccess("");
            await recordRentalChargeCollection(task.chargeId);
            setSuccess("Collection recorded. It is now waiting for moderator verification.");
            await loadTasks();
        } catch (caught) {
            const backendMessage = isAxiosError(caught)
                ? caught.response?.data?.message
                : null;
            setError(
                Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || "Unable to record this collection.",
            );
        } finally {
            setBusyChargeId(null);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-50">
            <RiderNavbar />
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    <p className="text-sm font-semibold text-blue-700">Rider cash collection</p>
                    <h1 className="mt-1 text-2xl font-bold text-zinc-900 sm:text-3xl">
                        Party charge tasks
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                        Collect each listed charge in cash from the named owner or renter. Record each charge separately; a moderator will verify the collection.
                    </p>
                </div>

                {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
                {success && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}

                <div className="mt-6 space-y-4">
                    {loading ? (
                        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">Loading collection tasks…</div>
                    ) : tasks.length === 0 ? (
                        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
                            <p className="font-semibold text-zinc-800">No cash collection tasks</p>
                            <p className="mt-1 text-sm text-zinc-500">New charges will appear here for rentals assigned to you.</p>
                        </div>
                    ) : tasks.map((task) => (
                        <article key={task.chargeId} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                        {task.payerRole} · {task.type} charge
                                    </p>
                                    <h2 className="mt-1 text-lg font-semibold text-zinc-900">{task.productName}</h2>
                                    <p className="mt-1 text-sm text-zinc-600">Collect from {task.payerName}</p>
                                    <p className="mt-1 text-xs font-medium text-amber-700">
                                        Due at {task.dueStage === "DELIVERED_TO_RENTER" ? "delivery to the renter" : "final return to the owner"}
                                    </p>
                                </div>
                                <p className="text-xl font-bold text-zinc-900">৳{money(task.amount)}</p>
                            </div>

                            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                                <div><dt className="text-xs text-zinc-400">Pickup address</dt><dd className="mt-1 text-zinc-700">{task.pickupAddress}</dd></div>
                                <div><dt className="text-xs text-zinc-400">Delivery address</dt><dd className="mt-1 text-zinc-700">{task.deliveryAddress}</dd></div>
                            </dl>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                                <Link href={`/rentals/request/${task.rentalRequestId}`} className="text-sm font-medium text-blue-700 hover:text-blue-800">
                                    Open rental details
                                </Link>
                                <button
                                    type="button"
                                    disabled={busyChargeId !== null}
                                    onClick={() => void handleCollection(task)}
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {busyChargeId === task.chargeId ? "Saving…" : "Confirm cash collected"}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </main>
    );
}
