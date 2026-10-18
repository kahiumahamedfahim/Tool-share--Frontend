"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/axios";

interface RentalRequest {
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

    listedPricePerDay: string;
    agreedPricePerDay?: string;
    deliveryFee?: string;
    totalRentalAmount?: string;
    totalPayableAmount?: string;

    status: string;

    product?: {
        productId: string;
        name: string;
        pricePerDay: string | number;
    };

    renter?: {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };

    owner?: {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
}

export default function ModeratorRentalRequestsPage() {
    const router = useRouter();

    const [requests, setRequests] = useState<RentalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchRentalRequests();
    }, []);

    const fetchRentalRequests = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/rental/moderator/requests",
            );

            setRequests(response.data);
        } catch (error: any) {
            console.error(
                "Failed to fetch moderator rental requests:",
                error,
            );

            setError(
                error?.response?.data?.message ||
                    "Failed to load rental requests.",
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-BD", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600">
                    Loading rental requests...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Rental Requests
                    </h1>

                    <p className="text-gray-600 mt-2">
                        Review rental requests waiting for moderator approval.
                    </p>
                </div>

                {/* Empty State */}
                {requests.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border p-10 text-center">
                        <h2 className="text-xl font-semibold text-gray-800">
                            No Rental Requests
                        </h2>

                        <p className="text-gray-500 mt-2">
                            There are currently no rental requests waiting
                            for review.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {requests.map((request) => (
                            <div
                                key={request.rentalRequestId}
                                className="bg-white rounded-xl shadow-sm border p-6"
                            >
                                {/* Top Section */}
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Rental Request
                                        </p>

                                        <h2 className="text-xl font-bold text-gray-900">
                                            {request.rentalRequestId}
                                        </h2>
                                    </div>

                                    <span className="inline-flex w-fit px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                        {request.status}
                                    </span>
                                </div>

                                <div className="border-t my-5" />

                                {/* Product */}
                                <div className="mb-5">
                                    <h3 className="font-semibold text-gray-800 mb-2">
                                        Product
                                    </h3>

                                    <p className="text-gray-700">
                                        {request.product?.name ||
                                            request.productId}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        Product ID:{" "}
                                        {request.productId}
                                    </p>
                                </div>

                                {/* Users */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">

                                    {/* Renter */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-800 mb-3">
                                            Renter
                                        </h3>

                                        <p className="text-gray-700">
                                            {request.renter?.firstName}{" "}
                                            {request.renter?.lastName}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {request.renter?.email}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {request.renter?.phone}
                                        </p>
                                    </div>

                                    {/* Owner */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-800 mb-3">
                                            Owner
                                        </h3>

                                        <p className="text-gray-700">
                                            {request.owner?.firstName}{" "}
                                            {request.owner?.lastName}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {request.owner?.email}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {request.owner?.phone}
                                        </p>
                                    </div>
                                </div>

                                {/* Rental Information */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Start Date
                                        </p>

                                        <p className="font-medium text-gray-800">
                                            {formatDate(
                                                request.startDate,
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            End Date
                                        </p>

                                        <p className="font-medium text-gray-800">
                                            {formatDate(
                                                request.endDate,
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Rental Days
                                        </p>

                                        <p className="font-medium text-gray-800">
                                            {request.rentalDays} days
                                        </p>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-5">
                                    <h3 className="font-semibold text-gray-800 mb-3">
                                        Pricing
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Listed Price / Day
                                            </p>

                                            <p className="font-medium">
                                                ৳
                                                {
                                                    request.listedPricePerDay
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Agreed Price / Day
                                            </p>

                                            <p className="font-medium">
                                                ৳
                                                {request.agreedPricePerDay ||
                                                    "N/A"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Total Rental Amount
                                            </p>

                                            <p className="font-semibold text-lg">
                                                ৳
                                                {request.totalRentalAmount ||
                                                    "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery */}
                                <div className="mb-5">
                                    <h3 className="font-semibold text-gray-800 mb-2">
                                        Delivery
                                    </h3>

                                    <p className="text-gray-700">
                                        {request.deliveryAddress}
                                    </p>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Contact:{" "}
                                        {request.contactPhone}
                                    </p>
                                </div>

                                {/* Action */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() =>
                                            router.push(
                                                `/rental-requests/${request.rentalRequestId}`,
                                            )
                                        }
                                        className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                                    >
                                        Review Request
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}