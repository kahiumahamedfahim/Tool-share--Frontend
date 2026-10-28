"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import { getPendingUserDocuments, type PendingUserDocument } from "@/app/lib/rental-api";

export default function DocumentsPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<PendingUserDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDocuments = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await getPendingUserDocuments();
            setDocuments(Array.isArray(result) ? result : []);
        } catch (requestError: unknown) {
            const backendMessage = isAxiosError(requestError)
                ? requestError.response?.data?.message
                : undefined;
            setError(
                Array.isArray(backendMessage)
                    ? backendMessage.join(" ")
                    : backendMessage || "We couldn’t load pending documents. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const role = localStorage.getItem("userRole");
        if (role !== "ADMIN" && role !== "MODERATOR") {
            router.replace(role === "RIDER" ? "/rider/dashboard" : role === "USER" ? "/dashboard/user" : "/login");
            return;
        }
        void loadDocuments();
    }, [loadDocuments, router]);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(date));

    return (
        <>
            <RoleBasedNavbar />
            <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-blue-700">Verification workspace</p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Pending documents</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Review identity and rider documents submitted for account verification.
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Awaiting review</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">
                                {loading ? "—" : documents.length}
                            </p>
                        </div>
                    </header>

                    {error && (
                        <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-red-800">{error}</p>
                            <button
                                type="button"
                                onClick={() => void loadDocuments()}
                                className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    <section aria-label="Document review queue" className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {loading ? (
                            <div className="space-y-3 p-6" aria-label="Loading pending documents">
                                {[0, 1, 2].map((item) => (
                                    <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                                ))}
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-lg font-semibold text-green-700" aria-hidden="true">✓</div>
                                <h2 className="mt-4 text-lg font-semibold text-slate-900">You’re all caught up</h2>
                                <p className="mt-2 text-sm text-slate-600">There are no documents waiting for verification.</p>
                            </div>
                        ) : (
                            <>
                                <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_140px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                                    <span>Applicant</span><span>Submitted details</span><span>Received</span><span className="text-right">Action</span>
                                </div>
                                <ul className="divide-y divide-slate-100">
                                    {documents.map((document) => (
                                        <li key={document.id} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_140px] md:items-center md:px-6">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 md:hidden">Applicant</p>
                                                <p className="mt-1 truncate font-semibold text-slate-900">User {document.userId.slice(0, 8)}</p>
                                                <p className="mt-1 truncate text-xs text-slate-500">ID {document.userId}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 md:hidden">Submitted details</p>
                                                <div className="mt-1 flex flex-wrap gap-2">
                                                    {document.nidNumber && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">Identity document</span>}
                                                    {document.drivingLicenseNumber && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Driving licence</span>}
                                                    {document.vehicleNumber && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">Vehicle details</span>}
                                                    {!document.nidNumber && !document.drivingLicenseNumber && !document.vehicleNumber && <span className="text-sm text-slate-500">Documents submitted</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 md:hidden">Received</p>
                                                <p className="mt-1 text-sm text-slate-700">{formatDate(document.createdAt)}</p>
                                            </div>
                                            <div className="md:text-right">
                                                <Link
                                                    href={`${document.drivingLicenseNumber || document.vehicleNumber ? "/rider" : "/users"}/pending-documents/${encodeURIComponent(document.userId)}`}
                                                    className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:w-auto"
                                                >
                                                    Review documents
                                                </Link>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
