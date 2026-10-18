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

    return (
        <>
            {/* Mobile Overlay */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
                    onClick={closeMenu}
                />
            )}

            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* Logo */}
                    <Link
                        href="/dashboard/user"
                        onClick={closeMenu}
                        className="text-xl font-bold text-blue-600 transition hover:text-blue-700"
                    >
                        ToolShare
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center gap-2 lg:flex">

                        {/* Dashboard */}
                        <Link
                            href="/dashboard/user"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                pathname === "/dashboard/user"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-blue-600"
                            }`}
                        >
                            Dashboard
                        </Link>

                        {/* Products */}
                        <Link
                            href="/products"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isActive("/products") &&
                                pathname !== "/products/my-products" &&
                                pathname !== "/products/create"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-blue-600"
                            }`}
                        >
                            Products
                        </Link>

                        {/* My Products */}
                        <Link
                            href="/products/my-products"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isActive("/products/my-products")
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-blue-600"
                            }`}
                        >
                            My Products
                        </Link>

                        {/* Create Product */}
                        <Link
                            href="/products/create"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isActive("/products/create")
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-blue-600"
                            }`}
                        >
                            Create My Product
                        </Link>

                        {/* My Rental Requests */}
                        <Link
                            href="/rental-requests"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isActive("/rental-requests")
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-blue-600"
                            }`}
                        >
                            My Rentals
                        </Link>

                        {/* Owner Rental Requests */}
                        <Link
                            href="/rental-requests/owner"
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                isActive("/rental-requests/owner")
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-blue-600"
                            }`}
                        >
                            Rental Requests
                        </Link>

                        {/* Notifications */}
                        <NotificationBell />

                        {/* Logout */}
                        <Link
                            href="/logout"
                            className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                        >
                            Logout
                        </Link>
                    </div>

                    {/* Mobile Controls */}
                    <div className="flex items-center gap-2 lg:hidden">

                        {/* Notifications */}
                        <NotificationBell />

                        {/* Profile */}
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                            U
                        </div>

                        {/* Menu */}
                        <button
                            type="button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle navigation menu"
                            aria-expanded={menuOpen}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50"
                        >
                            {menuOpen ? "✕" : "☰"}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {menuOpen && (
                    <div className="border-t border-zinc-100 bg-white lg:hidden">
                        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">

                            {/* Dashboard */}
                            <Link
                                href="/dashboard/user"
                                onClick={closeMenu}
                                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    pathname === "/dashboard/user"
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                }`}
                            >
                                <span>
                                    Dashboard
                                </span>

                                {pathname === "/dashboard/user" && (
                                    <span className="text-xs">
                                        ●
                                    </span>
                                )}
                            </Link>

                            <div className="my-3 border-t border-zinc-100" />

                            {/* Products */}
                            <Link
                                href="/products"
                                onClick={closeMenu}
                                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    pathname === "/products"
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                }`}
                            >
                                <span>
                                    Products
                                </span>

                                {pathname === "/products" && (
                                    <span className="text-xs">
                                        ●
                                    </span>
                                )}
                            </Link>

                            {/* My Products */}
                            <Link
                                href="/products/my-products"
                                onClick={closeMenu}
                                className={`mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isActive("/products/my-products")
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                }`}
                            >
                                <span>
                                    My Products
                                </span>

                                {isActive("/products/my-products") && (
                                    <span className="text-xs">
                                        ●
                                    </span>
                                )}
                            </Link>

                            {/* Create Product */}
                            <Link
                                href="/products/create"
                                onClick={closeMenu}
                                className={`mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isActive("/products/create")
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                }`}
                            >
                                <span>
                                    Create My Product
                                </span>

                                {isActive("/products/create") && (
                                    <span className="text-xs">
                                        ●
                                    </span>
                                )}
                            </Link>

                            {/* My Rental Requests */}
                            <Link
                                href="/rental-requests"
                                onClick={closeMenu}
                                className={`mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isActive("/rental-requests") &&
                                    !isActive("/rental-requests/owner")
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                }`}
                            >
                                <span>
                                    My Rentals
                                </span>

                                {isActive("/rental-requests") &&
                                    !isActive("/rental-requests/owner") && (
                                        <span className="text-xs">
                                            ●
                                        </span>
                                    )}
                            </Link>

                            {/* Owner Rental Requests */}
                            <Link
                                href="/rental-requests/owner"
                                onClick={closeMenu}
                                className={`mt-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isActive("/rental-requests/owner")
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                }`}
                            >
                                <span>
                                    Rental Requests
                                </span>

                                {isActive("/rental-requests/owner") && (
                                    <span className="text-xs">
                                        ●
                                    </span>
                                )}
                            </Link>

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