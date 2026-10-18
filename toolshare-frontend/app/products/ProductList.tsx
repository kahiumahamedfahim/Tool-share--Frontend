"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import api from "@/app/lib/axios";

import {
    Product,
    ProductsResponse,
    PaginationMeta,
} from "./types/product";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000";

const DEFAULT_META: PaginationMeta = {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
};

function getProductImage(product: Product): string | null {
    const image =
        product.images?.[0] ??
        product.productImages?.[0];

    const path =
        image?.imageUrl ??
        image?.url ??
        image?.filePath;

    if (!path) {
        return null;
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function formatPrice(price: number | string): string {
    const amount = Number(price);

    return Number.isFinite(amount)
        ? new Intl.NumberFormat("en-BD", {
              maximumFractionDigits: 2,
          }).format(amount)
        : String(price);
}

function getStatus(product: Product): string {
    return (
        product.availabilityStatus ??
        "AVAILABLE"
    );
}

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);

    const [meta, setMeta] =
        useState<PaginationMeta>(DEFAULT_META);

    const [page, setPage] = useState(1);

    const [limit, setLimit] = useState(12);

    const [isLoading, setIsLoading] = useState(true);

    const [error, setError] = useState("");

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const response =
                await api.get<ProductsResponse>(
                    "/products",
                    {
                        params: {
                            page,
                            limit,
                        },
                    },
                );

            const rows = Array.isArray(
                response.data.data,
            )
                ? response.data.data
                : [];

            setProducts(rows);

            setMeta({
                ...DEFAULT_META,
                ...(response.data.meta ?? {}),
                page,
                limit,
            });
        } catch (fetchError) {
            console.error(
                "Failed to fetch products:",
                fetchError,
            );

            setError(
                "Unable to load products. Check that the backend is running, then try again.",
            );

            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        void fetchProducts();
    }, [fetchProducts]);

    const totalPages = Math.max(
        1,
        meta.totalPages || 1,
    );

    if (isLoading) {
        return (
            <section className="min-h-screen w-full bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="mb-6 text-2xl font-bold text-gray-900">
                    Products
                </h1>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white"
                            >
                                <div className="h-48 bg-gray-200" />

                                <div className="space-y-3 p-4">
                                    <div className="h-4 w-3/4 rounded bg-gray-200" />

                                    <div className="h-3 rounded bg-gray-200" />

                                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="mx-auto w-full max-w-7xl bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Products
                    </h1>

                    <p className="mt-1 text-sm text-gray-600">
                        Explore products available to rent on ToolShare.
                    </p>

                    {!error && (
                        <p className="mt-2 text-xs text-gray-500">
                            {meta.total} product
                            {meta.total === 1 ? "" : "s"} found
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <label
                        htmlFor="products-page-size"
                        className="text-sm text-gray-600"
                    >
                        Show
                    </label>

                    <select
                        id="products-page-size"
                        value={limit}
                        onChange={(event) => {
                            setPage(1);
                            setLimit(
                                Number(event.target.value),
                            );
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                    </select>

                    <span className="text-sm text-gray-600">
                        per page
                    </span>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() =>
                            void fetchProducts()
                        }
                        className="mt-3 rounded-md bg-red-600 px-3 py-2 font-medium text-white hover:bg-red-700"
                    >
                        Try again
                    </button>
                </div>
            )}

            {!error && products.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                        No products found
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                        There are no products to display on this page yet.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.map((product) => {
                            const imageUrl =
                                getProductImage(product);

                            const status =
                                getStatus(product);

                            const available =
                                status.toUpperCase() ===
                                "AVAILABLE";

                            const detailsUrl = `/products/${encodeURIComponent(
                                product.productId,
                            )}`;

                            return (
                                <article
                                    key={
                                        product.productId ||
                                        product.id
                                    }
                                    className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <Link
                                        href={detailsUrl}
                                        aria-label={`View ${product.name}`}
                                    >
                                        <div className="flex h-48 items-center justify-center overflow-hidden bg-gray-100">
                                            {imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-400">
                                                    No image available
                                                </span>
                                            )}
                                        </div>
                                    </Link>

                                    <div className="flex flex-1 flex-col p-4">
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <h2 className="line-clamp-1 text-base font-semibold text-gray-900">
                                                <Link
                                                    href={detailsUrl}
                                                    className="hover:text-blue-700"
                                                >
                                                    {product.name}
                                                </Link>
                                            </h2>

                                            <span
                                                className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                                    available
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {status.replaceAll(
                                                    "_",
                                                    " ",
                                                )}
                                            </span>
                                        </div>

                                        <p className="mb-3 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-gray-600">
                                            {product.description ||
                                                "No description provided."}
                                        </p>

                                        <p className="mb-3 text-lg font-bold text-gray-900">
                                            ৳
                                            {formatPrice(
                                                product.pricePerDay,
                                            )}

                                            <span className="ml-1 text-xs font-normal text-gray-500">
                                                / day
                                            </span>
                                        </p>

                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {product.category?.name && (
                                                <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                                    {
                                                        product
                                                            .category
                                                            .name
                                                    }
                                                </span>
                                            )}

                                            <span
                                                className={`rounded-md px-2 py-1 text-xs font-medium ${
                                                    product.negotiationAllowed
                                                        ? "bg-amber-50 text-amber-700"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {product.negotiationAllowed
                                                    ? "Negotiable"
                                                    : "Fixed price"}
                                            </span>
                                        </div>

                                        <Link
                                            href={detailsUrl}
                                            className="mt-auto inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                        >
                                            View details
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <nav
                            aria-label="Product pagination"
                            className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
                        >
                            <p className="text-sm text-gray-600">
                                Page {page} of{" "}
                                {totalPages}
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                Math.max(
                                                    1,
                                                    current - 1,
                                                ),
                                        )
                                    }
                                    disabled={page <= 1}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                <span className="min-w-10 text-center text-sm font-medium text-gray-700">
                                    {page}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                Math.min(
                                                    totalPages,
                                                    current + 1,
                                                ),
                                        )
                                    }
                                    disabled={
                                        page >= totalPages
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </nav>
                    )}
                </>
            )}
        </section>
    );
}