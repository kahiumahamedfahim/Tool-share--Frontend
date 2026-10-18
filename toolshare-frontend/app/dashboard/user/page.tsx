"use client";

import Link from "next/link";
import UserNavbar from "@/app/components/user/usernavbar";

export default function UserDashboard() {
    return (
        <>
         <UserNavbar />
        <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                        Welcome to ToolShare 👋
                    </h1>

                    <p className="mt-2 text-sm text-zinc-600 sm:text-base">
                        Manage your products and explore tools available for rent.
                    </p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    {/* Browse Products */}
                    <Link
                        href="/products"
                        className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl">
                            🛠️
                        </div>

                        <h2 className="text-lg font-semibold text-zinc-900">
                            Browse Products
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                            Explore tools and products available from other users.
                        </p>

                        <span className="mt-4 inline-block text-sm font-medium text-blue-600 group-hover:text-blue-700">
                            View Products →
                        </span>
                    </Link>

                    {/* My Products */}
                    <Link
                        href="/products/my-products"
                        className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-2xl">
                            📦
                        </div>

                        <h2 className="text-lg font-semibold text-zinc-900">
                            My Products
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                            View and manage the products you have uploaded.
                        </p>

                        <span className="mt-4 inline-block text-sm font-medium text-green-600 group-hover:text-green-700">
                            View My Products →
                        </span>
                    </Link>

                    {/* Create Product */}
                    <Link
                        href="/products/create"
                        className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-2xl">
                            ➕
                        </div>

                        <h2 className="text-lg font-semibold text-zinc-900">
                            Create My Product
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                            Upload your tool or product and make it available on ToolShare.
                        </p>

                        <span className="mt-4 inline-block text-sm font-medium text-purple-600 group-hover:text-purple-700">
                            Add Product →
                        </span>
                    </Link>

                </div>

                {/* Quick Actions */}
                <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-zinc-900">
                        Quick Actions
                    </h2>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">

                        <Link
                            href="/products"
                            className="rounded-lg bg-zinc-900 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-zinc-800"
                        >
                            Browse Products
                        </Link>

                        <Link
                            href="/products/create"
                            className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-center text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                        >
                            Create Product
                        </Link>

                    </div>
                </div>

            </div>
        </main>
        </>
    );
}