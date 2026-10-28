"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GuestNavbar() {
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* Logo */}
                <Link
                    href="/"
                    className="text-xl font-bold text-blue-600 transition hover:text-blue-700"
                >
                    ToolShare
                </Link>

                {/* Navigation */}
                <div className="flex items-center gap-2">

                    {/* Home */}
                    <Link
                        href="/"
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            pathname === "/"
                                ? "bg-blue-50 text-blue-600"
                                : "text-zinc-600 hover:bg-zinc-50 hover:text-blue-600"
                        }`}
                    >
                        Home
                    </Link>

                    {/* Register */}
                    <Link
                        href="/register"
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            pathname === "/register"
                                ? "bg-blue-600 text-white"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                        Register
                    </Link>

                </div>
            </div>
        </nav>
    );
}