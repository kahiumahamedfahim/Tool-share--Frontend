"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
    useNotifications,
} from "@/app/components/NotificationProvider";

export default function AdminNavbar()
{
    const pathname =
        usePathname();

    const [
        menuOpen,
        setMenuOpen,
    ] = useState(false);

    const [
        mobileNotificationOpen,
        setMobileNotificationOpen,
    ] = useState(false);

    const {
        notifications,
    } = useNotifications();

    const navItems = [
        {
            label: "Dashboard",
            href: "/admin/dashboard",
        },
        {
            label: "Create Admin",
            href: "/admin/create-admin",
        },
        {
            label: "Create Moderator",
            href: "/moderator/create-moderator",
        },
        {
            label: "Create Rider",
            href: "/rider/create-rider",
        },
        {
            label: "Users",
            href: "/admin/users",
        },
        {
            label: "Document Verification",
            href: "/admin/document-verification",
        },
        {
            label: "Pending Documents",
            href: "/admin/pending-documents",
        },
        {
            label: "moderator Pending Documents",
            href: "/moderator/pending-documents",
        },
        {
            label: "rider Pending Documents",
            href: "/rider/pending-documents",
        },
        {
            label: "users Pending Documents",
            href: "/users/pending-documents",
        },
    ];

    const isActive = (href: string) =>
    {
        if (
            href ===
                "/admin/pending-documents" ||
            href ===
                "/moderator/pending-documents" ||
            href ===
                "/rider/pending-documents" ||
            href ===
                "/users/pending-documents"
        )
        {
            return (
                pathname === href ||
                pathname.startsWith(
                    `${href}/`,
                )
            );
        }

        return pathname === href;
    };

    const closeMenu = () =>
    {
        setMenuOpen(false);
    };

    const closeMobileNotification = () =>
    {
        setMobileNotificationOpen(false);
    };

    return (
        <>
            {/* ================================================== */}
            {/* Mobile Overlay */}
            {/* ================================================== */}

            {menuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
                    onClick={closeMenu}
                />
            )}

            {/* ================================================== */}
            {/* Navbar */}
            {/* ================================================== */}

            <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-md">

                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* ================================================== */}
                    {/* Logo */}
                    {/* ================================================== */}

                    <Link
                        href="/admin/dashboard"
                        onClick={closeMenu}
                        className="text-xl font-bold text-blue-600 transition hover:text-blue-700"
                    >
                        ToolShare
                    </Link>

                    {/* ================================================== */}
                    {/* Desktop Navigation */}
                    {/* ================================================== */}

                    <div className="hidden items-center gap-5 lg:flex">

                        {navItems.map((item) =>
                        {
                            const active =
                                isActive(
                                    item.href,
                                );

                            return (
                                <Link
                                    key={
                                        item.href
                                    }
                                    href={
                                        item.href
                                    }
                                    className={`text-sm font-medium transition ${
                                        active
                                            ? "text-blue-600"
                                            : "text-zinc-600 hover:text-blue-600"
                                    }`}
                                >
                                    {
                                        item.label
                                    }
                                </Link>
                            );
                        })}

                        {/* ================================================== */}
                        {/* Desktop Notification */}
                        {/* ================================================== */}

                        <div className="group relative">

                            <button
                                type="button"
                                aria-label="Notifications"
                                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                                <span className="text-xl">
                                    🔔
                                </span>

                                {notifications.length >
                                    0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                                        {
                                            notifications.length
                                        }
                                    </span>
                                )}
                            </button>

                            {/* ================================================== */}
                            {/* Desktop Hover Notification List */}
                            {/* ================================================== */}

                            <div className="invisible absolute right-0 top-10 z-[60] w-80 translate-y-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">

                                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">

                                    {/* Header */}

                                    <div className="border-b border-zinc-100 px-4 py-3">

                                        <h3 className="text-sm font-semibold text-zinc-900">
                                            Notifications
                                        </h3>

                                        <p className="mt-1 text-xs text-zinc-500">
                                            New document submissions
                                        </p>

                                    </div>

                                    {/* Notification List */}

                                    <div className="max-h-96 overflow-y-auto">

                                        {notifications.length ===
                                        0 ? (
                                            <div className="px-4 py-8 text-center">

                                                <div className="text-2xl">
                                                    🔔
                                                </div>

                                                <p className="mt-2 text-sm text-zinc-500">
                                                    No new notifications
                                                </p>

                                            </div>
                                        ) : (
                                            notifications.map(
                                                (
                                                    notification,
                                                    index,
                                                ) => (
                                                    <Link
                                                        key={`${notification.userId}-${index}`}
                                                        href={`/users/pending-documents/${notification.userId}`}
                                                        className="block border-b border-zinc-100 px-4 py-3 transition hover:bg-zinc-50"
                                                    >

                                                        <div className="flex gap-3">

                                                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm">
                                                                🔔
                                                            </div>

                                                            <div className="min-w-0">

                                                                <p className="text-sm font-semibold text-zinc-900">
                                                                    {
                                                                        notification.title
                                                                    }
                                                                </p>

                                                                <p className="mt-1 text-xs leading-5 text-zinc-600">
                                                                    {
                                                                        notification.message
                                                                    }
                                                                </p>

                                                                <p className="mt-1 truncate text-xs text-zinc-400">
                                                                    {
                                                                        notification.email
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </Link>
                                                ),
                                            )
                                        )}

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* ================================================== */}
                        {/* Desktop Logout */}
                        {/* ================================================== */}

                        <Link
                            href="/logout"
                            className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                        >
                            Logout
                        </Link>

                    </div>

                    {/* ================================================== */}
                    {/* Mobile Controls */}
                    {/* ================================================== */}

                    <div className="flex items-center gap-2 lg:hidden">

                        {/* Profile */}

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                            A
                        </div>

                        {/* Mobile Notification Bell */}

                        <button
                            type="button"
                            onClick={() =>
                                setMobileNotificationOpen(
                                    !mobileNotificationOpen,
                                )
                            }
                            aria-label="Notifications"
                            aria-expanded={
                                mobileNotificationOpen
                            }
                            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-blue-50 hover:text-blue-600"
                        >

                            <span>
                                🔔
                            </span>

                            {notifications.length >
                                0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                                    {
                                        notifications.length
                                    }
                                </span>
                            )}

                        </button>

                        {/* Menu Button */}

                        <button
                            type="button"
                            onClick={() =>
                                setMenuOpen(
                                    !menuOpen,
                                )
                            }
                            aria-label="Toggle navigation menu"
                            aria-expanded={
                                menuOpen
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50"
                        >
                            {menuOpen
                                ? "✕"
                                : "☰"}
                        </button>

                    </div>

                </div>

                {/* ================================================== */}
                {/* Mobile Notification List */}
                {/* ================================================== */}

                {mobileNotificationOpen && (
                    <div className="fixed left-4 right-4 top-20 z-[60] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl lg:hidden">

                        {/* Header */}

                        <div className="border-b border-zinc-100 px-4 py-3">

                            <h3 className="text-sm font-semibold text-zinc-900">
                                Notifications
                            </h3>

                            <p className="mt-1 text-xs text-zinc-500">
                                New document submissions
                            </p>

                        </div>

                        {/* Notification List */}

                        <div className="max-h-[70vh] overflow-y-auto">

                            {notifications.length ===
                            0 ? (
                                <div className="px-4 py-8 text-center">

                                    <div className="text-2xl">
                                        🔔
                                    </div>

                                    <p className="mt-2 text-sm text-zinc-500">
                                        No new notifications
                                    </p>

                                </div>
                            ) : (
                                notifications.map(
                                    (
                                        notification,
                                        index,
                                    ) => (
                                        <Link
                                            key={`${notification.userId}-${index}`}
                                            href={`/users/pending-documents/${notification.userId}`}
                                            onClick={
                                                closeMobileNotification
                                            }
                                            className="block border-b border-zinc-100 px-4 py-4 transition hover:bg-zinc-50"
                                        >

                                            <div className="flex gap-3">

                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                                                    🔔
                                                </div>

                                                <div className="min-w-0">

                                                    <p className="text-sm font-semibold text-zinc-900">
                                                        {
                                                            notification.title
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                                                        {
                                                            notification.message
                                                        }
                                                    </p>

                                                    <p className="mt-1 truncate text-xs text-zinc-400">
                                                        {
                                                            notification.email
                                                        }
                                                    </p>

                                                </div>

                                            </div>

                                        </Link>
                                    ),
                                )
                            )}

                        </div>

                    </div>
                )}

                {/* ================================================== */}
                {/* Mobile Navigation */}
                {/* ================================================== */}

                {menuOpen && (
                    <div className="border-t border-zinc-100 bg-white lg:hidden">

                        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">

                            {/* Navigation Links */}

                            <div className="space-y-1">

                                {navItems.map(
                                    (item) =>
                                    {
                                        const active =
                                            isActive(
                                                item.href,
                                            );

                                        return (
                                            <Link
                                                key={
                                                    item.href
                                                }
                                                href={
                                                    item.href
                                                }
                                                onClick={
                                                    closeMenu
                                                }
                                                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                                    active
                                                        ? "bg-blue-50 text-blue-600"
                                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                                }`}
                                            >

                                                <span>
                                                    {
                                                        item.label
                                                    }
                                                </span>

                                                {active && (
                                                    <span className="text-xs">
                                                        ●
                                                    </span>
                                                )}

                                            </Link>
                                        );
                                    },
                                )}

                            </div>

                            {/* ================================================== */}
                            {/* Divider */}
                            {/* ================================================== */}

                            <div className="my-4 border-t border-zinc-100" />

                            {/* ================================================== */}
                            {/* Mobile Logout */}
                            {/* ================================================== */}

                            <Link
                                href="/logout"
                                onClick={
                                    closeMenu
                                }
                                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                            >

                                <span>
                                    Logout
                                </span>

                                <span>
                                    →
                                </span>

                            </Link>

                        </div>

                    </div>
                )}

            </nav>
        </>
    );
}