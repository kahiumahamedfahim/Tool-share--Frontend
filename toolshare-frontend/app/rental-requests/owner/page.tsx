"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import api from "@/app/lib/axios";
import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";

interface RentalProduct {
    productId: string;
    name: string;
    pricePerDay: number | string;
}

interface RentalRenter {
    userId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
}

interface RentalRequest {
    id: string;
    rentalRequestId: string;
    productId: string;
    renterId: string;
    ownerId: string;
    startDate: string;
    rentalDays: number;
    endDate: string;
    pickupAddress: string;
    deliveryAddress: string;
    contactPhone: string;
    listedPricePerDay: number | string;
    offeredPricePerDay?: number | string | null;
    agreedPricePerDay?: number | string | null;
    deliveryFee?: number | string | null;
    totalRentalAmount?: number | string | null;
    totalPayableAmount?: number | string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    product?: RentalProduct;
    renter?: RentalRenter;
}

const getStatusClasses = (status: string) => {
    switch (status) {
        case "PENDING":
            return "bg-yellow-100 text-yellow-700";

        case "NEGOTIATING":
            return "bg-blue-100 text-blue-700";

        case "PRICE_AGREED":
            return "bg-purple-100 text-purple-700";

        case "APPROVED":
            return "bg-green-100 text-green-700";

        case "REJECTED":
            return "bg-red-100 text-red-700";

        case "EXPIRED":
            return "bg-gray-100 text-gray-600";

        default:
            return "bg-gray-100 text-gray-600";
    }
};

const formatStatus = (status: string) => {
    return status
        .replace(/\_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (date: string) => {
    if (!date) {
        return "N/A";
    }

    return new Date(date).toLocaleDateString("en-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export default function OwnerRentalRequestsPage() {
    const [requests, setRequests] = useState<RentalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRentalRequests = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    "/rental/owner/requests",
                );

                const responseData = response.data;

                if (Array.isArray(responseData)) {
                    setRequests(responseData);
                } else if (Array.isArray(responseData?.data)) {
                    setRequests(responseData.data);
                } else {
                    setRequests([]);
                }
            } catch (err: any) {
                console.error(
                    "Failed to fetch owner rental requests:",
                    err,
                );

                setError(
                    err?.response?.data?.message ||
                        "Failed to load rental requests.",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchRentalRequests();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <RoleBasedNavbar />

            <main className="mx-auto max-w-7xl px-6 py-10">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Rental Requests
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Manage rental requests received for your
                        products.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                            >
                                <div className="h-5 w-40 rounded bg-gray-200" />

                                <div className="mt-4 h-4 w-56 rounded bg-gray-200" />

                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="h-12 rounded bg-gray-200" />
                                    <div className="h-12 rounded bg-gray-200" />
                                </div>

                                <div className="mt-6 h-10 rounded bg-gray-200" />
                            </div>
                        ))}
                    </div>
                ) : requests.length === 0 ? (

                    /* Empty State */
                    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                            📦
                        </div>

                        <h2 className="mt-5 text-xl font-semibold text-gray-900">
                            No rental requests
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                            You have not received any rental requests
                            for your products yet.
                        </p>

                        <Link
                            href="/products/my-products"
                            className="mt-6 inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            View My Products
                        </Link>
                    </div>

                ) : (

                    /* Request List */
                    <div className="grid gap-6 md:grid-cols-2">
                        {requests.map((request) => (
                            <div
                                key={request.rentalRequestId}
                                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                            >

                                {/* Top section */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Rental Request
                                        </p>

                                        <h2 className="mt-1 text-lg font-semibold text-gray-900">
                                            {request.rentalRequestId}
                                        </h2>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                            request.status,
                                        )}`}
                                    >
                                        {formatStatus(
                                            request.status,
                                        )}
                                    </span>
                                </div>

                                {/* Product */}
                                <div className="mt-6">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Product
                                    </p>

                                    <h3 className="mt-1 text-base font-semibold text-gray-900">
                                        {request.product?.name ||
                                            request.productId}
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Product ID:{" "}
                                        {request.productId}
                                    </p>
                                </div>

                                {/* Renter */}
                                <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Renter
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {request.renter
                                            ? `${request.renter.firstName || ""} ${
                                                  request.renter.lastName || ""
                                              }`.trim() ||
                                              request.renter.userId
                                            : request.renterId}
                                    </p>

                                    {request.renter?.email && (
                                        <p className="mt-1 text-sm text-gray-500">
                                            {request.renter.email}
                                        </p>
                                    )}
                                </div>

                                {/* Rental information */}
                                <div className="mt-6 grid grid-cols-2 gap-4">

                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <p className="text-xs text-gray-500">
                                            Start Date
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {formatDate(
                                                request.startDate,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <p className="text-xs text-gray-500">
                                            Rental Days
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {request.rentalDays} day
                                            {request.rentalDays !== 1
                                                ? "s"
                                                : ""}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <p className="text-xs text-gray-500">
                                            Listed Price
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            ৳
                                            {
                                                request.listedPricePerDay
                                            }
                                            /day
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <p className="text-xs text-gray-500">
                                            Offered Price
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {request.offeredPricePerDay !=
                                            null
                                                ? `৳${request.offeredPricePerDay}/day`
                                                : "No offer"}
                                        </p>
                                    </div>
                                </div>

                                {/* Agreed Price */}
                                {request.agreedPricePerDay !=
                                    null && (
                                    <div className="mt-4 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-purple-700">
                                                Agreed Price
                                            </span>

                                            <span className="text-sm font-semibold text-purple-900">
                                                ৳
                                                {
                                                    request.agreedPricePerDay
                                                }
                                                /day
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Total */}
                                {request.totalRentalAmount !=
                                    null && (
                                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">
                                        <span className="text-sm text-gray-500">
                                            Total Rental Amount
                                        </span>

                                        <span className="text-lg font-bold text-gray-900">
                                            ৳
                                            {
                                                request.totalRentalAmount
                                            }
                                        </span>
                                    </div>
                                )}

                                {/* Delivery */}
                                <div className="mt-5 border-t border-gray-100 pt-5">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Delivery Address
                                    </p>

                                    <p className="mt-1 text-sm text-gray-700">
                                        {request.deliveryAddress ||
                                            "N/A"}
                                    </p>
                                </div>

                                {/* Created date */}
                                <p className="mt-4 text-xs text-gray-400">
                                    Requested on{" "}
                                    {formatDate(
                                        request.createdAt,
                                    )}
                                </p>

                                {/* Action */}
                                <div className="mt-5">
                                    <Link
                                        href={`/rental-requests/${request.rentalRequestId}`}
                                        className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                    >
                                        View Request Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}