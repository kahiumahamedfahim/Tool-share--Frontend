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
            <section className="ts-container min-h-[calc(100vh-4rem)] py-10">
                <div className="mb-8 max-w-2xl">
                    <p className="text-sm font-semibold text-primary">ToolShare marketplace</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Find a tool for your next project</h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600">Explore equipment shared by people in your community.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
                            >
                                <div className="aspect-[4/3] bg-slate-200" />

                                <div className="space-y-3 p-4">
                                    <div className="h-4 w-3/4 rounded bg-slate-200" />

                                    <div className="h-3 rounded bg-slate-200" />

                                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="ts-container min-h-[calc(100vh-4rem)] py-10 text-foreground sm:py-12">
            <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-primary">ToolShare marketplace</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Find a tool for your next project</h1>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Explore equipment shared by people in your community.
                    </p>

                    {!error && (
                        <p className="mt-3 text-sm text-slate-500">
                            <span className="font-semibold tabular-nums text-slate-800">{meta.total}</span> listing{meta.total === 1 ? "" : "s"}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:self-auto">
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
                        className="ts-input min-h-10 w-auto rounded-lg px-3 py-2 text-sm"
                    >
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                    </select>

                    <span className="text-sm text-slate-600">
                        per page
                    </span>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
                >
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() =>
                            void fetchProducts()
                        }
                        className="w-fit rounded-lg bg-red-700 px-4 py-2.5 font-semibold text-white hover:bg-red-800"
                    >
                        Try again
                    </button>
                </div>
            )}

            {!error && products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <div aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">⌕</div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-950">
                        Nothing to show yet
                    </h2>

                    <p className="mt-2 text-sm text-slate-600">
                        No available listings match this page right now. Check back soon.
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
                                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                                >
                                    <Link
                                        href={detailsUrl}
                                        aria-label={`View ${product.name}`}
                                    >
                                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                            {imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                                />
                                            ) : (
                                                <span className="text-sm text-slate-400">
                                                    No image available
                                                </span>
                                            )}
                                            <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${available ? "bg-white/95 text-emerald-800" : "bg-white/95 text-slate-600"}`}>
                                                {status.replaceAll("_", " ")}
                                            </span>
                                        </div>
                                    </Link>

                                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <h2 className="line-clamp-2 min-h-12 text-base font-semibold leading-6 tracking-tight text-slate-950">
                                                <Link
                                                    href={detailsUrl}
                                                    className="transition hover:text-primary"
                                                >
                                                    {product.name}
                                                </Link>
                                            </h2>

                                        </div>

                                        <p className="mb-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                                            {product.description ||
                                                "No description provided."}
                                        </p>

                                        <p className="mb-4 text-xl font-semibold tracking-tight text-slate-950">
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
                                                <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-800">
                                                    {
                                                        product
                                                            .category
                                                            .name
                                                    }
                                                </span>
                                            )}

                                            <span
                                                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                                    product.negotiationAllowed
                                                        ? "bg-amber-50 text-amber-800"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {product.negotiationAllowed
                                                    ? "Negotiable"
                                                    : "Fixed price"}
                                            </span>
                                        </div>

                                        {product.location?.district && (
                                            <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
                                                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M16 8.3c0 4.2-6 9-6 9s-6-4.8-6-9a6 6 0 1 1 12 0Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>
                                                {product.location.upazila ? `${product.location.upazila}, ` : ""}{product.location.district}
                                            </p>
                                        )}

                                        <Link
                                            href={detailsUrl}
                                            className="ts-button-primary mt-auto w-full"
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
