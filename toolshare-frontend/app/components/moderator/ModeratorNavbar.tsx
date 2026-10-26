"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
    useNotifications,
} from "@/app/components/notifications/NotificationProvider";

export default function ModeratorNavbar()
{
    const pathname = usePathname();

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


    /*
    |--------------------------------------------------------------------------
    | Navigation Items
    |--------------------------------------------------------------------------
    */

    const managementItems = [
        {
            label: "Create Moderator",
            href: "/moderator/create-moderator",
        },
        {
            label: "Create Rider",
            href: "/rider/create-rider",
        },
    ];


    const documentItems = [
        {
            label: "Pending Documents",
            href: "/moderator/pending-documents",
        },
        {
            label: "Rider Documents",
            href: "/rider/pending-documents",
        },
        {
            label: "User Documents",
            href: "/users/pending-documents",
        },
    ];


    const categoryItems = [
        {
            label: "Category",
            href: "/moderator/categories",
        },
    ];


    const rentalItems = [
        {
            label: "Rental Reviews",
            href: "/rentals/moderator",
        },
    ];


    /*
    |--------------------------------------------------------------------------
    | Active Route
    |--------------------------------------------------------------------------
    */

    const isActive = (href: string) =>
    {
        return (
            pathname === href ||
            pathname.startsWith(`${href}/`)
        );
    };


    const isDropdownActive = (
        items: { href: string }[],
    ) =>
    {
        return items.some((item) =>
            isActive(item.href),
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Close Functions
    |--------------------------------------------------------------------------
    */

    const closeMenu = () =>
    {
        setMenuOpen(false);
    };


    const closeMobileNotification = () =>
    {
        setMobileNotificationOpen(false);
    };


    /*
    |--------------------------------------------------------------------------
    | Desktop Dropdown
    |--------------------------------------------------------------------------
    */

    const DesktopDropdown = ({
        label,
        items,
    }: {
        label: string;
        items: {
            label: string;
            href: string;
        }[];
    }) =>
    {
        const active = isDropdownActive(items);

        return (
            <div className="group relative">

                <button
                    type="button"
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                            ? "bg-blue-50 text-blue-600"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-blue-600"
                    }`}
                >
                    {label}

                    <span className="text-xs">
                        ▾
                    </span>
                </button>


                <div className="invisible absolute left-0 top-11 z-[60] w-56 translate-y-2 rounded-xl border border-zinc-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">

                    {items.map((item) =>
                    {
                        const itemActive = isActive(
                            item.href,
                        );

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                                    itemActive
                                        ? "bg-blue-50 font-medium text-blue-600"
                                        : "text-zinc-600 hover:bg-blue-50 hover:text-blue-600"
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}

                </div>

            </div>
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Mobile Dropdown
    |--------------------------------------------------------------------------
    */

    const MobileDropdown = ({
        label,
        items,
    }: {
        label: string;
        items: {
            label: string;
            href: string;
        }[];
    }) =>
    {
        const active = isDropdownActive(items);

        return (
            <div className="space-y-1">

                <div
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                        active
                            ? "bg-blue-50 text-blue-600"
                            : "text-zinc-700"
                    }`}
                >
                    {label}
                </div>


                <div className="ml-3 space-y-1 border-l border-zinc-200 pl-3">

                    {items.map((item) =>
                    {
                        const itemActive = isActive(
                            item.href,
                        );

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeMenu}
                                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                                    itemActive
                                        ? "bg-blue-50 font-medium text-blue-600"
                                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                                }`}
                            >

                                <span>
                                    {item.label}
                                </span>

                                {itemActive && (
                                    <span className="text-xs">
                                        ●
                                    </span>
                                )}

                            </Link>
                        );
                    })}

                </div>

            </div>
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Notification List
    |--------------------------------------------------------------------------
    */

    const NotificationList = ({
        mobile = false,
    }: {
        mobile?: boolean;
    }) =>
    {
        return (
            <>

                {notifications.length === 0 ? (

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
                                    mobile
                                        ? closeMobileNotification
                                        : undefined
                                }
                                className="block border-b border-zinc-100 px-4 py-3 transition hover:bg-zinc-50"
                            >

                                <div className="flex gap-3">

                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm">
                                        🔔
                                    </div>


                                    <div className="min-w-0">

                                        <p className="text-sm font-semibold text-zinc-900">
                                            {notification.title}
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-zinc-600">
                                            {notification.message}
                                        </p>

                                        <p className="mt-1 truncate text-xs text-zinc-400">
                                            {notification.email}
                                        </p>

                                    </div>

                                </div>

                            </Link>

                        ),
                    )

                )}

            </>
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

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
                        href="/moderator/dashboard"
                        onClick={closeMenu}
                        className="text-xl font-bold text-blue-600 transition hover:text-blue-700"
                    >
                        ToolShare
                    </Link>


                    {/* ================================================== */}
                    {/* Desktop Navigation */}
                    {/* ================================================== */}

                    <div className="hidden items-center gap-2 lg:flex">


                        {/* Dashboard */}

                        <Link
                            href="/moderator/dashboard"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                pathname === "/moderator/dashboard"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-blue-600"
                            }`}
                        >
                            Dashboard
                        </Link>


                        {/* Management */}

                        <DesktopDropdown
                            label="Management"
                            items={managementItems}
                        />


                        {/* Documents */}

                        <DesktopDropdown
                            label="Documents"
                            items={documentItems}
                        />


                        {/* Categories */}

                        <DesktopDropdown
                            label="Categories"
                            items={categoryItems}
                        />


                        {/* Rentals */}

                        <DesktopDropdown
                            label="Rentals"
                            items={rentalItems}
                        />


                        {/* ================================================== */}
                        {/* Desktop Notification */}
                        {/* ================================================== */}

                        <div className="group relative ml-1">

                            <button
                                type="button"
                                aria-label="Notifications"
                                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-blue-50 hover:text-blue-600"
                            >

                                <span className="text-xl">
                                    🔔
                                </span>


                                {notifications.length > 0 && (

                                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                                        {notifications.length}
                                    </span>

                                )}

                            </button>


                            {/* Notification Dropdown */}

                            <div className="invisible absolute right-0 top-11 z-[60] w-80 translate-y-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">

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


                                    {/* List */}

                                    <div className="max-h-96 overflow-y-auto">

                                        <NotificationList />

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
                            M
                        </div>


                        {/* Notification */}

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


                            {notifications.length > 0 && (

                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                                    {notifications.length}
                                </span>

                            )}

                        </button>


                        {/* Menu */}

                        <button
                            type="button"
                            onClick={() =>
                                setMenuOpen(!menuOpen)
                            }
                            aria-label="Toggle navigation menu"
                            aria-expanded={menuOpen}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50"
                        >
                            {menuOpen ? "✕" : "☰"}
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


                        {/* List */}

                        <div className="max-h-[70vh] overflow-y-auto">

                            <NotificationList mobile />

                        </div>

                    </div>

                )}


                {/* ================================================== */}
                {/* Mobile Navigation */}
                {/* ================================================== */}

                {menuOpen && (

                    <div className="border-t border-zinc-100 bg-white lg:hidden">

                        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">


                            {/* Dashboard */}

                            <Link
                                href="/moderator/dashboard"
                                onClick={closeMenu}
                                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    pathname === "/moderator/dashboard"
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                }`}
                            >

                                <span>
                                    Dashboard
                                </span>

                                {pathname === "/moderator/dashboard" && (
                                    <span className="text-xs">
                                        ●
                                    </span>
                                )}

                            </Link>


                            <div className="my-3 border-t border-zinc-100" />


                            {/* Management */}

                            <MobileDropdown
                                label="Management"
                                items={managementItems}
                            />


                            <div className="my-3 border-t border-zinc-100" />


                            {/* Documents */}

                            <MobileDropdown
                                label="Documents"
                                items={documentItems}
                            />


                            <div className="my-3 border-t border-zinc-100" />


                            {/* Categories */}

                            <MobileDropdown
                                label="Categories"
                                items={categoryItems}
                            />


                            <div className="my-3 border-t border-zinc-100" />


                            {/* Rentals */}

                            <MobileDropdown
                                label="Rentals"
                                items={rentalItems}
                            />


                            <div className="my-4 border-t border-zinc-100" />


                            {/* Logout */}

                            <Link
                                href="/logout"
                                onClick={closeMenu}
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