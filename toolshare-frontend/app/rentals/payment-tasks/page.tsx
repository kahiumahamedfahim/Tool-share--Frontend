"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import RiderNavbar from "@/app/components/rider/RiderNavbar";

import {
    getMyPaymentTasks,
    markPaymentCollected,
    markPaymentDelivered,
    type RiderPaymentTask,
} from "@/app/lib/rental-api";

/* Helper - Price */
const formatPrice = (value: string | number) =>
    Number(value ?? 0).toFixed(2);

export default function RiderPaymentTasksPage() {
    const [tasks, setTasks] = useState<
        RiderPaymentTask[]
    >([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [busyPaymentId, setBusyPaymentId] =
        useState<string | null>(null);

    const [actionError, setActionError] =
        useState("");

    /* =================================================
       LOAD TASKS
    ================================================= */

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const data =
                await getMyPaymentTasks();

            setTasks(data ?? []);
        } catch (err) {
            console.error(
                "Failed to load payment tasks:",
                err,
            );

            let message =
                "Unable to load your payment tasks.";

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
        loadTasks();
    }, []);

    /* =================================================
       ACTIONS
    ================================================= */

    const handleTaskAction = async (
        task: RiderPaymentTask,
        action: "COLLECT" | "DELIVER",
    ) => {
        setActionError("");

        try {
            setBusyPaymentId(task.paymentId);

            if (action === "COLLECT") {
                await markPaymentCollected(
                    task.paymentId,
                );
            } else {
                await markPaymentDelivered(
                    task.paymentId,
                );
            }

            await loadTasks();
        } catch (err) {
            console.error(
                "Failed to update payment task:",
                err,
            );

            let message =
                "Unable to update the payment.";

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
            setBusyPaymentId(null);
        }
    };

    /* =================================================
       RENDER
    ================================================= */

    return (
        <main className="min-h-screen bg-zinc-50">

            <RiderNavbar />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

                    <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                        Cash Payment Tasks
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                        Collect the rental payment in
                        cash at handover, then hand it
                        over to the product owner. The
                        owner confirms when the money
                        arrives.
                    </p>

                </div>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-6">

                    {loading ? (
                        <div className="grid gap-4">
                            {[0, 1].map((index) => (
                                <div
                                    key={index}
                                    className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-white"
                                />
                            ))}
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
                            <div className="text-3xl">
                                🎉
                            </div>

                            <h2 className="mt-3 text-lg font-semibold text-zinc-900">
                                No open payment tasks
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                New cash collection tasks
                                assigned by moderatid review
                                will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">

                            {actionError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    {actionError}
                                </div>
                            )}

                            {tasks.map(
                                (task) => (
                                    <div
                                        key={
                                            task.paymentId
                                        }
                                        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                                    >

                                        <div className="flex flex-wrap items-start justify-between gap-3">

                                            <div>

                                                <p className="text-xs font-medium text-zinc-500">
                                                    {task.paymentId}{" "}
                                                    ·{" "}
                                                    {task.rentalId}
                                                </p>

                                                <h3 className="mt-1 text-base font-semibold text-zinc-900">
                                                    Collect ৳
                                                    {formatPrice(
                                                        task.amount,
                                                    )}
                                                </h3>

                                            </div>

                                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                {task.status.replace(
                                                    /_/g,
                                                    " ",
                                                )}
                                            </span>

                                        </div>

                                        <div className="mt-4 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">

                                            <div>
                                                <p className="text-xs font-medium text-zinc-400">
                                                    Rental
                                                    dates
                                                </p>

                                                <p className="mt-0.5">
                                                    {new Date(
                                                        task.rental.startDate,
                                                    ).toLocaleDateString()}{" "}
                                                    →{" "}
                                                    {new Date(
                                                        task.rental.endDate,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-zinc-400">
                                                    Contact
                                                    phone
                                                </p>

                                                <p className="mt-0.5">
                                                    {
                                                        task
                                                            .request
                                                            .contactPhone
                                                    }
                                                </p>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <p className="text-xs font-medium text-zinc-400">
                                                    Pickup
                                                    address
                                                </p>

                                                <p className="mt-0.5">
                                                    {
                                                        task.rental.pickupAddress
                                                    }
                                                </p>
                                            </div>

                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-3 border-t border-zinc-100 pt-4">

                                            {task.status ===
                                                "PENDING" && (
                                                <button
                                                    type="button"
                                                    disabled={
                                                        busyPaymentId ===
                                                        task.paymentId
                                                    }
                                                    onClick={() =>
                                                        handleTaskAction(
                                                            task,
                                                            "COLLECT",
                                                        )
                                                    }
                                                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {busyPaymentId ===
                                                    task.paymentId
                                                        ? "Processing..."
                                                        : "Mark cash collected"}
                                                </button>
                                            )}

                                            {task.status ===
                                                "COLLECTED_BY_RIDER" && (
                                                <button
                                                    type="button"
                                                    disabled={
                                                        busyPaymentId ===
                                                        task.paymentId
                                                    }
                                                    onClick={() =>
                                                        handleTaskAction(
                                                            task,
                                                            "DELIVER",
                                                        )
                                                    }
                                                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {busyPaymentId ===
                                                    task.paymentId
                                                        ? "Processing..."
                                                        : "Mark delivered to owner"}
                                                </button>
                                            )}

                                            {task.status ===
                                                "DELIVERED_TO_OWNER" && (
                                                <p className="text-sm text-zinc-500">
                                                    Waiting for
                                                    the owner to
                                                    confirm
                                                    receiving the
                                                    cash…
                                                </p>
                                            )}

                                        </div>

                                    </div>
                                ),
                            )}

                        </div>
                    )}

                </div>

            </div>

        </main>
    );
}
