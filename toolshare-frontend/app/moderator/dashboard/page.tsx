"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import ModeratorNavbar from "../../components/moderator/ModeratorNavbar";
import {
    cleanupCompletedRentals,
    getModeratorDashboardStats,
    type ModeratorDashboardStats,
} from "../../lib/rental-api";

/* Helper - Date */
const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

export default function ModeratorDashboardPage() {
    const [stats, setStats] = useState<ModeratorDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<{
        deletedRentals: number;
        cutoffDate: string;
    } | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getModeratorDashboardStats();
                setStats(data);
            } catch (err) {
                console.error(
                    "Failed to load moderator dashboard stats:",
                    err,
                );

                let message =
                    "Unable to load dashboard statistics.";

                if (isAxiosError(err)) {
                    const backendMessage =
                        err.response?.data?.message;

                    message = Array.isArray(backendMessage)
                        ? backendMessage.join(", ")
                        : backendMessage || message;
                }

                setError(message);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    const handleCleanup = async () => {
        const confirmed = window.confirm(
            "Permanently delete all completed rentals older than 30 days? This cannot be undone.",
        );

        if (!confirmed) return;

        try {
            setCleanupLoading(true);
            setError("");

            const data = await cleanupCompletedRentals();
            setCleanupResult(data);
            // Stats will refresh via the page re-rendering after state update
        } catch (err) {
            console.error("Cleanup failed:", err);

            let message =
                "Unable to complete cleanup.";

            if (isAxiosError(err)) {
                const backendMessage =
                    err.response?.data?.message;

                message = Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setError(message);
        } finally {
            setCleanupLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <ModeratorNavbar />

                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                            Moderator Dashboard
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                            Loading dashboard statistics...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50">

            {/* Moderator Navbar */}
            <ModeratorNavbar />

            {/* Dashboard Content */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                        Moderator Dashboard
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Monitor all rentals, track rider assignments,
                        and oversee custody workflows.
                    </p>

                    {error && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                </div>

                {/* Overview Stats */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        label="Total Rentals"
                        value={stats?.totalRentals ?? 0}
                        icon="📦"
                        className="border-blue-200 bg-blue-50 text-blue-700"
                    />
                    <StatCard
                        label="Active Rentals"
                        value={stats?.activeRentals ?? 0}
                        icon="🔄"
                        className="border-indigo-200 bg-indigo-50 text-indigo-700"
                    />
                    <StatCard
                        label="Pending Handover"
                        value={stats?.pendingHandoverRentals ?? 0}
                        icon="⏳"
                        className="border-amber-200 bg-amber-50 text-amber-700"
                    />
                    <StatCard
                        label="Completed"
                        value={stats?.completedRentals ?? 0}
                        icon="✅"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    />
                    <StatCard
                        label="Pending Review"
                        value={stats?.pendingReviews ?? 0}
                        icon="📋"
                        className="border-violet-200 bg-violet-50 text-violet-700"
                    />
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    <Link
                        href="/rentals/moderator"
                        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >

                        <div className="flex items-center justify-between">

                            <h2 className="text-base font-semibold text-zinc-900">
                                Rental Review Queue
                            </h2>

                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                                {stats?.pendingReviews ?? 0}
                            </span>

                        </div>

                        <p className="mt-2 text-sm text-zinc-500">
                            Review price-agreed rental requests and
                            confirm or reject bookings.
                        </p>

                    </Link>

                    <Link
                        href="/moderator/pending-documents"
                        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >

                        <h2 className="text-base font-semibold text-zinc-900">
                            Pending Documents
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            Verify identity documents submitted by
                            users.
                        </p>

                    </Link>

                    <Link
                        href="/moderator/categories"
                        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >

                        <h2 className="text-base font-semibold text-zinc-900">
                            Categories
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            Manage product categories and their
                            images.
                        </p>

                    </Link>

                </div>

                {/* Recent Rentals */}
                <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-base font-semibold text-zinc-900">
                        Recent Rentals
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        Track custody progress and rider assignments
                        across all active rentals.
                    </p>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase">
                                    <th className="pb-3 font-medium">Request ID</th>
                                    <th className="pb-3 font-medium">Product</th>
                                    <th className="pb-3 font-medium">Renter</th>
                                    <th className="pb-3 font-medium">Owner</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Rider</th>
                                    <th className="pb-3 font-medium">Dates</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="py-4 text-sm text-zinc-900">REQ-001</td>
                                    <td className="py-4 text-sm text-zinc-900">Power Drill</td>
                                    <td className="py-4 text-sm text-zinc-600">renter@example.com</td>
                                    <td className="py-4 text-sm text-zinc-600">owner@example.com</td>
                                    <td className="py-4">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                            Active
                                        </span>
                                    </td>
                                    <td className="py-4 text-sm text-zinc-600">rider@example.com</td>
                                    <td className="py-4 text-sm text-zinc-600">22/10/26 → 30/10/26</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 30-Day Rental Cleanup */}
                <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-base font-semibold text-zinc-900">
                        30-Day Rental Cleanup
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        Permanently delete completed rentals older than
                        30 days. This action cannot be undone.
                    </p>

                    {cleanupResult && (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                            Cleaned up{" "}
                            <span className="font-semibold">
                                {cleanupResult.deletedRentals}
                            </span>{" "}
                            rental(s) completed before{" "}
                            {new Date(cleanupResult.cutoffDate).toLocaleDateString(
                                undefined,
                                { day: "2-digit", month: "short", year: "numeric" },
                            )}.
                        </div>
                    )}

                    <div className="mt-4">
                        <button
                            type="button"
                            disabled={cleanupLoading}
                            onClick={handleCleanup}
                            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                cleanupLoading
                                    ? "bg-zinc-300 text-zinc-600"
                                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                            }`}
                        >
                            {cleanupLoading
                                ? "Cleaning up..."
                                : "Run 30-Day Cleanup"}
                        </button>

                        {stats?.completedRentals && stats.completedRentals > 0 && (
                            <p className="mt-2 text-xs text-zinc-500">
                                {stats.completedRentals} completed rental(s) on record.
                            </p>
                        )}
                    </div>
                </div>

            </div>

        </main>
    );
}

function StatCard({
    label,
    value,
    icon,
    className,
}: {
    label: string;
    value: number;
    icon: string;
    className: string;
}) {
    return (
        <div className={`rounded-xl border p-5 shadow-sm ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {value}
                    </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/50">
                    {icon}
                </div>
            </div>
        </div>
    );
}