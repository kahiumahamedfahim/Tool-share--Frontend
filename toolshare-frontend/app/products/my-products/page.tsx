"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import api from "@/app/lib/axios";

import {
    PaginationMeta,
    Product,
    ProductsResponse,
} from "../types/product";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000";

export default function MyProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    const getMyProducts = useCallback(async () => {
        try {
            setLoading(true);
            setApiError("");

            const response =
                await api.get<ProductsResponse>(
                    "/products/my-products",
                    {
                        params: {
                            page,
                            limit,
                        },
                    },
                );

            setProducts(response.data.data);

            setMeta(
                response.data.meta
                    ? {
                          page:
                              response.data.meta.page ??
                              page,
                          limit:
                              response.data.meta.limit ??
                              limit,
                          total:
                              response.data.meta.total ??
                              0,
                          totalPages:
                              response.data.meta.totalPages ??
                              1,
                      }
                    : null,
            );
        } catch (error) {
            console.error(
                "Error fetching my products:",
                error,
            );

            const responseData =
                (
                    error as {
                        response?: {
                            data?: {
                                message?: string | string[];
                            };
                        };
                    }
                ).response?.data;

            const message = responseData?.message;

            setApiError(
                Array.isArray(message)
                    ? message.join(", ")
                    : message ||
                          "Could not load your products.",
            );
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        void getMyProducts();
    }, [getMyProducts]);

    const handleLimitChange = (value: number) => {
        setLimit(value);
        setPage(1);
    };

    const goToPreviousPage = () => {
        if (page > 1) {
            setPage(
                (currentPage) => currentPage - 1,
            );
        }
    };

    const goToNextPage = () => {
        if (meta && page < meta.totalPages) {
            setPage(
                (currentPage) => currentPage + 1,
            );
        }
    };

    return (
        <>
            <RoleBasedNavbar />

            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                My Products
                            </h1>

                            <p className="mt-2 text-sm text-slate-500">
                                Manage the products you have uploaded to ToolShare.
                            </p>
                        </div>

                        <Link
                            href="/products/create"
                            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            + Upload Product
                        </Link>
                    </div>

                    {/* Error */}
                    {apiError && (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                            <p className="text-sm text-red-700">
                                {apiError}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    void getMyProducts()
                                }
                                className="mt-3 text-sm font-semibold text-red-800 underline hover:text-red-950"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                            <p className="mt-4 text-sm font-medium text-slate-600">
                                Loading your products...
                            </p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading &&
                        !apiError &&
                        products.length === 0 && (
                            <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                <div className="text-5xl">
                                    🛠️
                                </div>

                                <h2 className="mt-4 text-xl font-semibold text-slate-900">
                                    No products yet
                                </h2>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                    Products you upload will appear here.
                                    Start by adding your first product to ToolShare.
                                </p>

                                <Link
                                    href="/products/create"
                                    className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Upload Your First Product
                                </Link>
                            </div>
                        )}

                    {/* Product Grid */}
                    {!loading &&
                        products.length > 0 && (
                            <>
                                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {products.map(
                                        (product) => {
                                            const productImage =
                                                product.productImages?.find(
                                                    (image) =>
                                                        image.filePath,
                                                );

                                            return (
                                                <article
                                                    key={
                                                        product.productId
                                                    }
                                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                                                >
                                                    {/* Product Image */}
                                                    <div className="flex h-48 items-center justify-center bg-slate-100">
                                                        {productImage?.filePath ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={`${API_BASE_URL}/${productImage.filePath.replace(
                                                                    /\\/g,
                                                                    "/",
                                                                )}`}
                                                                alt={
                                                                    product.name
                                                                }
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-5xl">
                                                                🛠️
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Product Information */}
                                                    <div className="p-5">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h2 className="line-clamp-1 font-semibold text-slate-900">
                                                                {
                                                                    product.name
                                                                }
                                                            </h2>

                                                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                                                {
                                                                    product.availabilityStatus
                                                                }
                                                            </span>
                                                        </div>

                                                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                                            {
                                                                product.description
                                                            }
                                                        </p>

                                                        <div className="mt-4 flex items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-lg font-bold text-slate-900">
                                                                    ৳
                                                                    {Number(
                                                                        product.pricePerDay,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    Per day
                                                                </p>
                                                            </div>

                                                            <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700">
                                                                {product
                                                                    .category
                                                                    ?.name ||
                                                                    "Uncategorized"}
                                                            </span>
                                                        </div>

                                                        {product.negotiationAllowed && (
                                                            <p className="mt-3 text-xs font-medium text-emerald-700">
                                                                Negotiation available
                                                            </p>
                                                        )}

                                                        {/* Product Actions */}
                                                        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                                            <Link
                                                                href={`/products/${product.productId}`}
                                                                className="rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                                                            >
                                                                View Details
                                                            </Link>

                                                            <Link
                                                                href={`/products/${product.productId}/edit`}
                                                                className="rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                                                            >
                                                                Update
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        },
                                    )}
                                </div>

                                {/* Pagination */}
                                {meta &&
                                    meta.totalPages >
                                        0 && (
                                        <div className="mt-8 flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                            {/* Pagination Summary */}
                                            <p className="text-sm font-medium text-slate-700">
                                                Page{" "}
                                                <span className="font-bold text-slate-900">
                                                    {
                                                        meta.page
                                                    }
                                                </span>{" "}
                                                of{" "}
                                                <span className="font-bold text-slate-900">
                                                    {
                                                        meta.totalPages
                                                    }
                                                </span>

                                                <span className="mx-2 text-slate-300">
                                                    |
                                                </span>

                                                <span className="text-slate-600">
                                                    {
                                                        meta.total
                                                    }{" "}
                                                    products
                                                </span>
                                            </p>

                                            {/* Pagination Controls */}
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <label
                                                        htmlFor="product-limit"
                                                        className="text-sm font-medium text-slate-700"
                                                    >
                                                        Show
                                                    </label>

                                                    <select
                                                        id="product-limit"
                                                        value={
                                                            limit
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            handleLimitChange(
                                                                Number(
                                                                    event
                                                                        .target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                    >
                                                        <option value={5}>
                                                            5
                                                        </option>

                                                        <option value={10}>
                                                            10
                                                        </option>

                                                        <option value={20}>
                                                            20
                                                        </option>

                                                        <option value={50}>
                                                            50
                                                        </option>
                                                    </select>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        goToPreviousPage
                                                    }
                                                    disabled={
                                                        page <=
                                                        1
                                                    }
                                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                                                >
                                                    Previous
                                                </button>

                                                <span className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-bold text-white shadow-sm">
                                                    {page}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        goToNextPage
                                                    }
                                                    disabled={
                                                        !meta ||
                                                        page >=
                                                            meta.totalPages
                                                    }
                                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                            </>
                        )}
                </div>
            </main>
        </>
    );
}