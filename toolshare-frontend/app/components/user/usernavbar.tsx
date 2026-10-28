"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import NotificationBell from "@/app/components/notifications/NotificationBell";

export default function UserNavbar() {
    const pathname = usePathname();

    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const isActive = (href: string) => {
        return (
            pathname === href ||
            pathname.startsWith(`${href}/`)
        );
    };

    const isProductsActive =
        pathname === "/products";

    const isMyProductsActive =
        isActive("/products/my-products");

    const isCreateProductActive =
        isActive("/products/create");

    const isMyRentalsActive =
        isActive("/rentals/my-requests");

    const isOwnerRequestsActive =
        isActive("/rentals/owner-requests");

    return (
        <>
            {/* =========================================
                MOBILE OVERLAY
            ========================================= */}

            {menuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
                    onClick={closeMenu}
                />
            )}

            {/* =========================================
                NAVBAR
            ========================================= */}

            <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* =================================
                        LOGO
                    ================================= */}

                    <Link
                        href="/dashboard/user"
                        onClick={closeMenu}
                        className="text-xl font-bold tracking-tight text-slate-950 transition hover:text-blue-600"
                    >
                        Tool<span className="text-blue-600">Share</span>
                    </Link>

                    {/* =================================
                        DESKTOP NAVIGATION
                    ================================= */}

                    <div className="hidden items-center gap-1 lg:flex">

                        {/* Dashboard */}

                        <Link
                            href="/dashboard/user"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                pathname === "/dashboard/user"
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                        >
                            Dashboard
                        </Link>

                        {/* Products */}

                        <Link
                            href="/products"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isProductsActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                        >
                            Products
                        </Link>

                        {/* My Products */}

                        <Link
                            href="/products/my-products"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isMyProductsActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                        >
                            My Products
                        </Link>

                        {/* Create Product */}

                        <Link
                            href="/products/create"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isCreateProductActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                        >
                            Create My Product
                        </Link>

                        {/* My Rental Requests */}

                        <Link
                            href="/rentals/my-requests"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isMyRentalsActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                        >
                            My Rentals
                        </Link>

                        {/* Owner Rental Requests */}

                        <Link
                            href="/rentals/owner-requests"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isOwnerRequestsActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                        >
                            Rental Requests
                        </Link>

                        {/* Notification */}

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

                        {/* Logout */}

                        <Link
                            href="/logout"
                            className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                        >
                            Logout
                        </Link>
                    </div>

                    {/* =================================
                        MOBILE CONTROLS
                    ================================= */}

                    <div className="flex items-center gap-2 lg:hidden">

                        {/* Notification */}

                        <NotificationBell />

                        {/* Profile */}

                        <Link
                            href="/users/profile"
                            aria-label="Open profile"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700 hover:bg-blue-100"
                        >
                            U
                        </Link>

                        {/* Menu */}

                        <button
                            type="button"
                            onClick={() =>
                                setMenuOpen(!menuOpen)
                            }
                            aria-label="Toggle navigation menu"
                            aria-expanded={menuOpen}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                        >
                            {menuOpen ? "✕" : "☰"}
                        </button>
                    </div>
                </div>

                {/* =========================================
                    MOBILE NAVIGATION
                ========================================= */}

                {menuOpen && (
                    <div className="border-t border-slate-100 bg-white lg:hidden">

                        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">

                            {/* Dashboard */}

                            <Link
                                href="/dashboard/user"
                                onClick={closeMenu}
                                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    pathname === "/dashboard/user"
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                            >
                                <span>
                                    Dashboard
                                </span>

                                {pathname ===
                                    "/dashboard/user" && (
                                    <span className="text-xs text-blue-600">
                                        ●
                                    </span>
                                )}
                            </Link>

                            <div className="my-3 border-t border-slate-100" />

                            {/* Products */}

                            <Link
                                href="/products"
                                onClick={closeMenu}
                                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isProductsActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                            >
                                <span>
                                    Products
                                </span>

                                {isProductsActive && (
                                    <span className="text-xs text-blue-600">
                                        ●
                                    </span>
                                )}
                            </Link>

                            {/* My Products */}

                            <Link
                                href="/products/my-products"
                                onClick={closeMenu}
                                className={`mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isMyProductsActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                            >
                                <span>
                                    My Products
                                </span>

                                {isMyProductsActive && (
                                    <span className="text-xs text-blue-600">
                                        ●
                                    </span>
                                )}
                            </Link>

                            {/* Create Product */}

                            <Link
                                href="/products/create"
                                onClick={closeMenu}
                                className={`mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isCreateProductActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                            >
                                <span>
                                    Create My Product
                                </span>

                                {isCreateProductActive && (
                                    <span className="text-xs text-blue-600">
                                        ●
                                    </span>
                                )}
                            </Link>

                            {/* =================================
                                RENTAL SECTION
                            ================================= */}

                            <div className="my-3 border-t border-slate-100" />

                            <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Rentals
                            </p>

                            {/* My Rentals */}

                            <Link
                                href="/rentals/my-requests"
                                onClick={closeMenu}
                                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isMyRentalsActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                            >
                                <span>
                                    My Rentals
                                </span>

                                {isMyRentalsActive && (
                                    <span className="text-xs text-blue-600">
                                        ●
                                    </span>
                                )}
                            </Link>

                            {/* Owner Requests */}

                            <Link
                                href="/rentals/owner-requests"
                                onClick={closeMenu}
                                className={`mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isOwnerRequestsActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                            >
                                <span>
                                    Rental Requests
                                </span>

                                {isOwnerRequestsActive && (
                                    <span className="text-xs text-blue-600">
                                        ●
                                    </span>
                                )}
                            </Link>

                            <div className="my-4 border-t border-slate-100" />

                            <Link
                                href="/users/profile"
                                onClick={closeMenu}
                                aria-current={isActive("/users/profile") ? "page" : undefined}
                                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isActive("/users/profile")
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                }`}
                            >
                                Profile &amp; Settings
                            </Link>

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
