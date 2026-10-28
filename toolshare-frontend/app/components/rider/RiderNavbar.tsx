"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import NotificationBell from "@/app/components/notifications/NotificationBell";

const links = [
    { label: "Dashboard", href: "/rider/dashboard" },
    { label: "Handover Tasks", href: "/rentals/handover-tasks" },
    { label: "Payment Tasks", href: "/rentals/payment-tasks" },
    { label: "Charge Collection", href: "/rentals/charge-tasks" },
];

export default function RiderNavbar() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);
    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(`${href}/`);

    return (
        <>
            {menuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    className="fixed inset-0 z-40 cursor-default bg-black/30 backdrop-blur-sm lg:hidden"
                    onClick={closeMenu}
                />
            )}

            <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/rider/dashboard"
                        onClick={closeMenu}
                        className="text-xl font-bold tracking-tight text-slate-950 transition hover:text-blue-700"
                    >
                        Tool<span className="text-blue-600">Share</span>
                        <span className="ml-2 hidden rounded-full bg-blue-50 px-2.5 py-1 align-middle text-xs font-semibold text-blue-700 sm:inline-flex">
                            Rider
                        </span>
                    </Link>

                    <div className="hidden items-center gap-1 lg:flex">
                        {links.map(({ label, href }) => (
                            <Link
                                key={href}
                                href={href}
                                aria-current={isActive(href) ? "page" : undefined}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                    isActive(href)
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                            >
                                {label}
                            </Link>
                        ))}
                        <div className="ml-1">
                            <NotificationBell />
                        </div>
                        <Link
                            href="/users/profile"
                            aria-current={isActive("/users/profile") ? "page" : undefined}
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isActive("/users/profile")
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                        >
                            Profile
                        </Link>
                        <Link
                            href="/logout"
                            className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                        >
                            Logout
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 lg:hidden">
                        <NotificationBell />
                        <Link
                            href="/users/profile"
                            aria-label="Open profile"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700 hover:bg-blue-100"
                        >
                            R
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((open) => !open)}
                            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                            aria-expanded={menuOpen}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                        >
                            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
                        </button>
                    </div>
                </div>

                {menuOpen && (
                    <div className="relative z-50 border-t border-slate-100 bg-white lg:hidden">
                        <div className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
                            {links.map(({ label, href }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={closeMenu}
                                    aria-current={isActive(href) ? "page" : undefined}
                                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                        isActive(href)
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                    }`}
                                >
                                    {label}
                                    {isActive(href) && <span aria-hidden="true">●</span>}
                                </Link>
                            ))}
                            <div className="my-2 border-t border-slate-100" />
                            <Link
                                href="/users/profile"
                                onClick={closeMenu}
                                aria-current={isActive("/users/profile") ? "page" : undefined}
                                className={`flex rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isActive("/users/profile")
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                            >
                                Profile &amp; Settings
                            </Link>
                            <Link
                                href="/logout"
                                onClick={closeMenu}
                                className="flex rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                                Logout
                            </Link>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}
