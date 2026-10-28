"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import RiderNavbar from "@/app/components/rider/RiderNavbar";
import { getMyPaymentTasks, getMyRentalChargeTasks } from "@/app/lib/rental-api";
import { getMyHandoverTasks } from "@/app/lib/handover-api";

interface TaskSummary {
    handovers: number | null;
    payments: number | null;
    charges: number | null;
}

const initialSummary: TaskSummary = { handovers: null, payments: null, charges: null };

export default function RiderDashboard() {
    const [summary, setSummary] = useState(initialSummary);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setHasError(false);
        const results = await Promise.allSettled([
            getMyHandoverTasks(),
            getMyPaymentTasks(),
            getMyRentalChargeTasks(),
        ]);

        let failed = false;
        const nextSummary = { ...initialSummary };
        if (results[0].status === "fulfilled") nextSummary.handovers = results[0].value?.length ?? 0;
        else failed = true;
        if (results[1].status === "fulfilled") nextSummary.payments = results[1].value?.length ?? 0;
        else failed = true;
        if (results[2].status === "fulfilled") nextSummary.charges = results[2].value?.length ?? 0;
        else failed = true;

        setSummary(nextSummary);
        setHasError(failed);
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadTasks();
    }, [loadTasks]);

    const tasks = [
        {
            number: "01",
            title: "Handover and return",
            description: "Follow pickup, delivery and return steps. Upload evidence and verify the handover OTP.",
            href: "/rentals/handover-tasks",
            count: summary.handovers,
            action: "Open handover tasks",
        },
        {
            number: "02",
            title: "Cash payment handoff",
            description: "Collect a rental payment from the renter, then deliver it to the owner.",
            href: "/rentals/payment-tasks",
            count: summary.payments,
            action: "Open payment tasks",
        },
        {
            number: "03",
            title: "Party charge collection",
            description: "Record separate rental or delivery charges from the assigned owner or renter.",
            href: "/rentals/charge-tasks",
            count: summary.charges,
            action: "Open charge tasks",
        },
    ];

    return (
        <main className="min-h-screen bg-background">
            <RiderNavbar />
            <div className="ts-container py-8 sm:py-10">
                <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-primary">Rider workspace</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Your tasks for today</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Handle each handover clearly and keep renters, owners and moderators informed as work moves forward.</p>
                    </div>
                    <button type="button" onClick={() => void loadTasks()} disabled={loading} className="ts-button-secondary w-full sm:w-auto">{loading ? "Refreshing…" : "Refresh tasks"}</button>
                </header>

                {hasError && (
                    <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-amber-900">Some task counts couldn’t be refreshed. You can still open each task list.</p>
                        <button type="button" onClick={() => void loadTasks()} className="w-fit text-sm font-semibold text-amber-900 underline underline-offset-4">Try again</button>
                    </div>
                )}

                <section aria-label="Assigned tasks" className="mt-7 grid gap-4 lg:grid-cols-3">
                    {tasks.map((task) => (
                        <Link key={task.href} href={task.href} className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-[0.14em] text-blue-700">TASK {task.number}</span>
                                <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-50 px-2 text-base font-semibold tabular-nums text-blue-800" aria-live="polite">
                                    {loading ? <span className="h-4 w-5 animate-pulse rounded bg-blue-100" aria-label="Loading" /> : task.count ?? "—"}
                                </span>
                            </div>
                            <h2 className="mt-8 text-lg font-semibold tracking-tight text-slate-950">{task.title}</h2>
                            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{task.description}</p>
                            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-800 group-hover:text-blue-950">{task.action}<span aria-hidden="true" className="transition group-hover:translate-x-0.5">→</span></span>
                        </Link>
                    ))}
                </section>

                <aside className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-100/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">Need to find a rental assignment?</h2>
                        <p className="mt-1 text-sm text-slate-600">Open your handover queue to see the next scheduled pickup, delivery or return.</p>
                    </div>
                    <Link href="/rentals/handover-tasks" className="inline-flex w-fit shrink-0 items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-950">View next assignment <span aria-hidden="true">→</span></Link>
                </aside>
            </div>
        </main>
    );
}
