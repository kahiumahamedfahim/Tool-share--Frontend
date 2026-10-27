"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";

import {
    getAllUsers,
    toggleUserStatus,
    type UserInfo,
} from "@/app/lib/rental-api";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAllUsers(1, 50);
            setUsers(data.data);
        } catch (err: any) {
            console.error("Failed to load users:", err);

            let message = "Unable to load users.";

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

    const handleToggleStatus = async (
        userId: string,
        currentStatus: string,
    ) => {
        const newStatus =
            currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

        const confirmed = window.confirm(
            `Are you sure you want to ${
                newStatus === "ACTIVE"
                    ? "activate"
                    : "deactivate"
            } this user?`,
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await toggleUserStatus(userId, newStatus);

            setSuccess(
                `User status updated to ${newStatus}.`,
            );

            await loadUsers();
        } catch (err: any) {
            console.error("Failed to toggle user status:", err);

            let message = "Unable to update user status.";

            if (isAxiosError(err)) {
                const backendMessage = err.response?.data?.message;
                message = Array.isArray(backendMessage)
                    ? backendMessage.join(", ")
                    : backendMessage || message;
            }

            setError(message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 p-4">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                            User Management
                        </h1>
                        <p className="mt-2 text-sm text-zinc-500">
                            Loading users...
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
                        User Management
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                        View and manage all users. Admins can activate or deactivate
                        moderators and riders. Users with active rentals cannot be
                        deactivated until their rentals are completed and 30 days have
                        passed.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {success}
                    </div>
                )}

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                        All Users
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase">
                                    <th className="pb-3 font-medium">User ID</th>
                                    <th className="pb-3 font-medium">Name</th>
                                    <th className="pb-3 font-medium">Email</th>
                                    <th className="pb-3 font-medium">Phone</th>
                                    <th className="pb-3 font-medium">Role</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Email Verified</th>
                                    <th className="pb-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-4 text-center text-zinc-500" colSpan={8}>
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.userId} className="hover:bg-zinc-50">
                                            <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                                                {user.userId}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-900">
                                                {user.firstName} {user.lastName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                {user.phone}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-900">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                                    user.role === "ADMIN"
                                                        ? "border-blue-200 bg-blue-50 text-blue-700"
                                                        : user.role === "MODERATOR"
                                                        ? "border-violet-200 bg-violet-50 text-violet-700"
                                                        : user.role === "RIDER"
                                                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-700"
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-900">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                                    user.status === "ACTIVE"
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                        : "border-red-200 bg-red-50 text-red-700"
                                                }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-600">
                                                {user.emailVerificationStatus ? (
                                                    <span className="text-emerald-600 font-semibold">
                                                        ✓ Verified
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-600 font-semibold">
                                                        ⏳ Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            user.userId,
                                                            user.status,
                                                        )
                                                    }
                                                    disabled={
                                                        user.role === "ADMIN" &&
                                                        user.status === "ACTIVE"
                                                    }
                                                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        user.status === "ACTIVE"
                                                            ? user.role === "ADMIN"
                                                                ? "bg-zinc-300 text-zinc-600"
                                                                : "bg-red-600 text-white hover:bg-red-700"
                                                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                                                    }`}
                                                >
                                                    {user.status === "ACTIVE"
                                                        ? user.role === "ADMIN"
                                                            ? "Admin (Locked)"
                                                            : "Deactivate"
                                                        : "Activate"}
                                                </button>
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
