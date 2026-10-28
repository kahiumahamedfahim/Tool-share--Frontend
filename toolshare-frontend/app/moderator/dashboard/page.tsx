"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import ModeratorNavbar from "../../components/moderator/ModeratorNavbar";
import {
    cleanupCompletedRentals,
    getAllRentalLogs,
    getModeratorDashboardStats,
    type ModeratorDashboardStats,
    type RentalLog,
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
    const [recentRentals, setRecentRentals] = useState<RentalLog[]>([]);
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

                const [data, rentals] = await Promise.all([
                    getModeratorDashboardStats(),
                    getAllRentalLogs(1, 5),
                ]);
                setStats(data);
                setRecentRentals(rentals.data);
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
            const [updatedStats, updatedRentals] = await Promise.all([
                getModeratorDashboardStats(),
                getAllRentalLogs(1, 5),
            ]);
            setStats(updatedStats);
            setRecentRentals(updatedRentals.data);
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
                        value={stats?.totalRentals ?? null}
                        tone="blue"
                    />
                    <StatCard
                        label="Active Rentals"
                        value={stats?.activeRentals ?? null}
                        tone="blue"
                    />
                    <StatCard
                        label="Pending Handover"
                        value={stats?.pendingHandoverRentals ?? null}
                        tone="amber"
                    />
                    <StatCard
                        label="Completed"
                        value={stats?.completedRentals ?? null}
                        tone="green"
                    />
                    <StatCard
                        label="Pending Review"
                        value={stats?.pendingReviews ?? null}
                        tone="blue"
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
                        Review the latest requests and open a record to inspect its status and custody details.
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
                                    <th className="pb-3 font-medium">Dates</th>
                                    <th className="pb-3 text-right font-medium">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentRentals.length === 0 ? (
                                    <tr><td className="py-10 text-center text-sm text-slate-500" colSpan={7}>No rental activity to show yet.</td></tr>
                                ) : recentRentals.map((rental) => (
                                    <tr key={rental.rentalRequestId} className="transition hover:bg-slate-50">
                                        <td className="whitespace-nowrap py-4 pr-4 text-xs font-medium text-slate-600">{rental.rentalRequestId.slice(0, 8)}</td>
                                        <td className="min-w-36 py-4 pr-4 text-sm font-medium text-slate-900">{rental.productName}</td>
                                        <td className="py-4 pr-4 text-sm text-slate-600">{rental.renterName}</td>
                                        <td className="py-4 pr-4 text-sm text-slate-600">{rental.ownerName}</td>
                                        <td className="py-4 pr-4"><StatusPill status={rental.status} /></td>
                                        <td className="py-4 pr-4 text-sm text-slate-600">{rental.startDate ? formatDate(rental.startDate) : "—"} – {rental.endDate ? formatDate(rental.endDate) : "—"}</td>
                                        <td className="py-4 text-right"><Link href={`/rentals/request/${rental.rentalRequestId}`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Open</Link></td>
                                    </tr>
                                ))}
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
    tone,
}: {
    label: string;
    value: number | null;
    tone: "blue" | "amber" | "green";
}) {
    const accent = tone === "amber" ? "border-l-amber-400" : tone === "green" ? "border-l-emerald-500" : "border-l-blue-600";
    return (
        <div className={`rounded-xl border border-slate-200 border-l-[3px] bg-white p-5 shadow-sm ${accent}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-950">{value ?? "—"}</p>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const normalized = status.toUpperCase();
    const tone = normalized === "APPROVED" || normalized === "COMPLETED" || normalized === "ACTIVE"
        ? "bg-emerald-50 text-emerald-800"
        : normalized === "PENDING" || normalized === "NEGOTIATING"
          ? "bg-amber-50 text-amber-800"
          : normalized === "REJECTED" || normalized === "CANCELLED"
            ? "bg-red-50 text-red-800"
            : "bg-slate-100 text-slate-700";
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status.replaceAll("_", " ")}</span>;
}
