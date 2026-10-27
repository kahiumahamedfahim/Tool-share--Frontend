"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import { getAllRentalLogs, type RentalLog } from "@/app/lib/rental-api";

export default function AdminRentalLogsPage() {
    const [logs, setLogs] = useState<RentalLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadLogs = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAllRentalLogs(1, 50);
            setLogs(data.data);
        } catch (err: any) {
            console.error("Failed to load rental logs:", err);

            let message = "Unable to load rental logs.";

            if (isAxiosError(err)) {
                const backendMessage = err.response?.data?.message;
                message = Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (value: string) =>
        new Date(value).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    const formatPrice = (value?: string) => {
        if (!value) return "—";
        const number = Number(value);
        if (Number.isNaN(number)) return `৳${value}`;
        return `৳${number.toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 p-4">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                            Rental Logs
                        </h1>
                        <p className="mt-2 text-sm text-zinc-500">
                            Loading rental logs...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-4">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
                        Rental Logs
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                        View all rental logs. Admins and moderators can monitor
                        every rental from request to completion.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                        All Rental Logs
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase">
                                    <th className="pb-3 font-medium">Request ID</th>
                                    <th className="pb-3 font-medium">Product</th>
                                    <th className="pb-3 font-medium">Renter</th>
                                    <th className="pb-3 font-medium">Owner</th>
                                    <th className="pb-3 font-medium">Dates</th>
                                    <th className="pb-3 font-medium">Days</th>
                                    <th className="pb-3 font-medium">Price/Day</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Actual Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-4 text-center text-zinc-500" colSpan={9}>
                                            No rental logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.rentalRequestId} className="hover:bg-zinc-50">
                                            <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                                                {log.rentalRequestId}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                {log.productName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                {log.renterName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                {log.ownerName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                {formatDate(log.startDate)}{" "}
                                                →{" "}
                                                {formatDate(log.endDate)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-900">
                                                {log.rentalDays}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                {formatPrice(log.agreedPricePerDay)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                                    log.status === "APPROVED"
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                        : log.status === "ACTIVE"
                                                        ? "border-blue-200 bg-blue-50 text-blue-700"
                                                        : log.status === "PENDING"
                                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                                        : log.status === "REJECTED"
                                                        ? "border-red-200 bg-red-50 text-red-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-600"
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                {log.actualRentalStatus || "—"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
