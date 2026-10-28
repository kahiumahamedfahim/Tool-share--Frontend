"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminNavbar from "@/app/components/admin/AdminNavbar";
import {
    getAllRentalLogs,
    getAllUsers,
    getPendingUserDocuments,
} from "@/app/lib/rental-api";

interface AdminOverview {
    users: number | null;
    rentals: number | null;
    pendingDocuments: number | null;
}

const emptyOverview: AdminOverview = { users: null, rentals: null, pendingDocuments: null };

export default function AdminDashboard() {
    const [overview, setOverview] = useState(emptyOverview);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setHasError(false);
        const [users, rentals, documents] = await Promise.allSettled([
            getAllUsers(1, 1),
            getAllRentalLogs(1, 1),
            getPendingUserDocuments(),
        ]);

        let failed = false;
        const nextOverview = { ...emptyOverview };
        if (users.status === "fulfilled") nextOverview.users = users.value.meta.total;
        else failed = true;
        if (rentals.status === "fulfilled") nextOverview.rentals = rentals.value.meta.total;
        else failed = true;
        if (documents.status === "fulfilled") nextOverview.pendingDocuments = documents.value.length;
        else failed = true;

        setOverview(nextOverview);
        setHasError(failed);
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadOverview();
    }, [loadOverview]);

    const overviewCards = [
        { label: "Registered accounts", value: overview.users, href: "/admin/users", detail: "View and manage users" },
        { label: "Rental records", value: overview.rentals, href: "/admin/rental-logs", detail: "Review platform activity" },
        { label: "Documents to review", value: overview.pendingDocuments, href: "/documents", detail: "Open verification queue" },
    ];

    const actions = [
        { title: "User management", detail: "Review accounts, roles and access status.", href: "/admin/users", tag: "Accounts" },
        { title: "Document verification", detail: "Work through identity and rider submissions.", href: "/documents", tag: "Verification" },
        { title: "Rental activity", detail: "Follow each request through its rental lifecycle.", href: "/admin/rental-logs", tag: "Operations" },
        { title: "Categories", detail: "Keep marketplace categories clear and current.", href: "/admin/categories", tag: "Marketplace" },
    ];

    return (
        <main className="min-h-screen bg-background">
            <AdminNavbar />
            <div className="ts-container py-8 sm:py-10">
                <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-primary">Platform operations</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Admin overview</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">A focused view of account activity, rental records and verification work that may need attention.</p>
                    </div>
                    <button type="button" onClick={() => void loadOverview()} disabled={loading} className="ts-button-secondary w-full sm:w-auto">{loading ? "Refreshing…" : "Refresh overview"}</button>
                </header>

                {hasError && (
                    <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-amber-900">Some overview totals could not be loaded.</p>
                        <button type="button" onClick={() => void loadOverview()} className="w-fit text-sm font-semibold text-amber-900 underline underline-offset-4">Try again</button>
                    </div>
                )}

                <section aria-label="Platform summary" className="mt-7 grid gap-4 sm:grid-cols-3">
                    {overviewCards.map((card) => (
                        <Link key={card.href} href={card.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-6">
                            <p className="text-sm font-medium text-slate-600">{card.label}</p>
                            <p className="mt-5 text-3xl font-semibold tabular-nums tracking-tight text-slate-950" aria-live="polite">{loading ? <span className="inline-block h-8 w-12 animate-pulse rounded-md bg-slate-100" aria-label="Loading" /> : card.value ?? "—"}</p>
                            <div className="mt-2 flex items-center justify-between gap-3">
                                <span className="text-xs text-slate-500">{card.detail}</span>
                                <span aria-hidden="true" className="text-primary transition group-hover:translate-x-0.5">→</span>
                            </div>
                        </Link>
                    ))}
                </section>

                <section className="mt-10">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-950">Operations</h2>
                        <p className="mt-1 text-sm text-slate-600">Go directly to a platform workflow.</p>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {actions.map((action) => (
                            <Link key={action.href} href={action.href} className="group flex items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">{action.tag}</span>
                                    <h3 className="mt-2 font-semibold tracking-tight text-slate-950">{action.title}</h3>
                                    <p className="mt-1.5 text-sm leading-5 text-slate-600">{action.detail}</p>
                                </div>
                                <span aria-hidden="true" className="shrink-0 text-lg text-blue-700 transition group-hover:translate-x-0.5">→</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-100/70 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">Need to create a team account?</h2>
                            <p className="mt-1 text-sm text-slate-600">Set up a moderator or rider account from the account management menu.</p>
                        </div>
                        <div className="flex gap-4 text-sm font-semibold text-blue-800">
                            <Link href="/moderator/create-moderator" className="hover:text-blue-950">Add moderator <span aria-hidden="true">→</span></Link>
                            <Link href="/rider/create-rider" className="hover:text-blue-950">Add rider <span aria-hidden="true">→</span></Link>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
