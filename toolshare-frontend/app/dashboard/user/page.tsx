"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import { getMyRentalRequests, getOwnerRentalRequests } from "@/app/lib/rental-api";
import api from "@/app/lib/axios";

interface DashboardSummary {
    renterRequests: number | null;
    ownerRequests: number | null;
    products: number | null;
}

const initialSummary: DashboardSummary = {
    renterRequests: null,
    ownerRequests: null,
    products: null,
};

export default function UserDashboard() {
    const [summary, setSummary] = useState(initialSummary);
    const [loading, setLoading] = useState(true);
    const [hasLoadError, setHasLoadError] = useState(false);

    const loadSummary = useCallback(async () => {
        setLoading(true);
        setHasLoadError(false);
        const results = await Promise.allSettled([
            getMyRentalRequests(1, 1),
            getOwnerRentalRequests(1, 1),
            api.get<{ data?: unknown[]; meta?: { total?: number } }>("/products/my-products", {
                params: { page: 1, limit: 1 },
            }),
        ]);

        let failed = false;
        const nextSummary = { ...initialSummary };
        if (results[0].status === "fulfilled") nextSummary.renterRequests = results[0].value.meta.total;
        else failed = true;
        if (results[1].status === "fulfilled") nextSummary.ownerRequests = results[1].value.meta.total;
        else failed = true;
        if (results[2].status === "fulfilled") nextSummary.products = results[2].value.data.meta?.total ?? results[2].value.data.data?.length ?? 0;
        else failed = true;

        setSummary(nextSummary);
        setHasLoadError(failed);
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    const metrics = [
        { label: "Your rental requests", value: summary.renterRequests, href: "/rentals/my-requests", note: "Requests you’ve sent" },
        { label: "Requests for your tools", value: summary.ownerRequests, href: "/rentals/owner-requests", note: "Rentals to review" },
        { label: "Tools you’ve listed", value: summary.products, href: "/products/my-products", note: "Your active listings" },
    ];

    return (
        <>
            <RoleBasedNavbar />
            <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary">Your ToolShare workspace</p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Good to have you back.</h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Pick up where you left off: find a tool, follow a rental, or manage what you share.</p>
                        </div>
                        <Link href="/products" className="ts-button-primary w-full sm:w-auto">Explore tools <span aria-hidden="true" className="ml-2">→</span></Link>
                    </header>

                    {hasLoadError && (
                        <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-amber-900">Some workspace totals couldn’t be loaded.</p>
                            <button type="button" onClick={() => void loadSummary()} className="w-fit text-sm font-semibold text-amber-900 underline underline-offset-4">Try again</button>
                        </div>
                    )}

                    <section aria-label="Workspace overview" className="mt-7 grid gap-4 sm:grid-cols-3">
                        {metrics.map((metric) => (
                            <Link key={metric.label} href={metric.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-6">
                                <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                                <p className="mt-5 text-3xl font-semibold tabular-nums tracking-tight text-slate-950" aria-live="polite">{loading ? <span className="inline-block h-8 w-12 animate-pulse rounded-md bg-slate-100" aria-label="Loading" /> : metric.value ?? "—"}</p>
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-xs text-slate-500">{metric.note}</span>
                                    <span aria-hidden="true" className="text-primary transition group-hover:translate-x-0.5">→</span>
                                </div>
                            </Link>
                        ))}
                    </section>

                    <section className="mt-10">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight text-slate-950">What would you like to do?</h2>
                                <p className="mt-1 text-sm text-slate-600">Your next steps, all in one place.</p>
                            </div>
                        </div>
                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            <ActionPanel
                                eyebrow="Find equipment"
                                title="Browse tools shared nearby"
                                description="Compare listings, check rental terms and find the right equipment for your project."
                                href="/products"
                                action="Browse available tools"
                                tone="blue"
                            />
                            <ActionPanel
                                eyebrow="Share with your community"
                                title="Put an idle tool to work"
                                description="Create a listing, set the rental windows and manage incoming requests from your workspace."
                                href="/products/create"
                                action="List a tool"
                                tone="slate"
                            />
                        </div>
                    </section>

                    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200 pt-5 text-sm">
                        <Link href="/rentals/my-requests" className="font-medium text-slate-600 hover:text-primary">View your rentals</Link>
                        <Link href="/rentals/owner-requests" className="font-medium text-slate-600 hover:text-primary">Review rental requests</Link>
                        <Link href="/products/my-products" className="font-medium text-slate-600 hover:text-primary">Manage your listings</Link>
                    </div>
                </div>
            </main>
        </>
    );
}

function ActionPanel({
    eyebrow,
    title,
    description,
    href,
    action,
    tone,
}: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    action: string;
    tone: "blue" | "slate";
}) {
    const colors = tone === "blue"
        ? "border-blue-100 bg-blue-50/70 text-blue-800"
        : "border-slate-200 bg-white text-slate-800";

    return (
        <article className={`flex flex-col rounded-2xl border p-6 sm:p-7 ${colors}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">{eyebrow}</p>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
            <p className="mt-2 max-w-lg flex-1 text-sm leading-6 text-slate-600">{description}</p>
            <Link href={href} className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-950">{action}<span aria-hidden="true">→</span></Link>
        </article>
    );
}
