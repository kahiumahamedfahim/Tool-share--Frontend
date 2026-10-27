import api from "./axios";
import { isAxiosError } from "axios";

/* =========================================================
   Rental Request Types
========================================================= */

export interface CreateRentalRequestPayload {
    productId: string;
    startDate: string;
    rentalDays: number;

    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;

    contactPhone: string;
    renterMessage?: string;

    offeredPricePerDay?: number;
}

export interface RentalRequest {
    rentalRequestId: string;

    productId: string;
    renterId: string;
    ownerId: string;

    startDate: string;
    rentalDays: number;
    endDate: string;

    pickupAddress: string;

    deliveryLatitude: number;
    deliveryLongitude: number;
    deliveryAddress: string;

    contactPhone: string;
    renterMessage?: string;

    listedPricePerDay: string;
    offeredPricePerDay?: string;
    agreedPricePerDay?: string;

    status:
        | "PENDING"
        | "NEGOTIATING"
        | "PRICE_AGREED"
        | "REJECTED"
        | "EXPIRED"
        | "APPROVED";

    moderatorId?: string;
    reviewedAt?: string;

    createdAt: string;
    updatedAt: string;

    deliveryFee?: string;

    platformCommissionRate?: string;

    riderId?: string | null;

    pickupConditionApproved?: boolean | null;
    pickupReviewNote?: string | null;
    moderatorPickupReviewedAt?: string | null;

    returnConditionApproved?: boolean | null;
    returnReviewNote?: string | null;
    moderatorReturnReviewedAt?: string | null;

    ownerChargesAccepted?: boolean | null;
    renterChargesAccepted?: boolean | null;

    ownerRentalFee?: string;
    ownerDeliveryFee?: string;
    renterRentalFee?: string;
    renterDeliveryFee?: string;

    product?: {
        productId: string;
        name: string;
        pricePerDay: string;
        negotiationAllowed?: boolean;
        location: {
            pickupAddress?: string;
        } | null;
    };

    renter?: {
        userId: string;
        name: string;
        email: string;
    };

    owner?: {
        userId: string;
        name: string;
        email: string;
    };

    moderator?: {
        userId: string;
        name: string;
        email: string;
    };

    rider?: {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    } | null;
}

export interface RiderInfo {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    emailVerificationStatus: boolean;
}

/* =========================================================
   Pagination
========================================================= */

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedRentalRequests {
    data: RentalRequest[];
    meta: PaginationMeta;
}

/* =========================================================
   Negotiation Types
========================================================= */

export interface NegotiationOffer {
    offerId: string;
    rentalRequestId: string;
    senderId: string;

    offeredPricePerDay: string;

    message?: string;

    status:
        | "PENDING"
        | "ACCEPTED"
        | "REJECTED";

    createdAt: string;

    sender?: {
        userId: string;
        name: string;
        email: string;
    };
}

export interface CreateNegotiationOfferPayload {
    rentalRequestId: string;
    offeredPricePerDay: number;
    message?: string;
}

/* =========================================================
   Create Rental Request
========================================================= */

export const createRentalRequest = async (
    payload: CreateRentalRequestPayload,
) => {
    const response = await api.post<RentalRequest>(
        "/rentals/request",
        payload,
    );

    return response.data;
};

/* =========================================================
   Get Renter's Rental Requests
========================================================= */

export const getMyRentalRequests = async (
    page = 1,
    limit = 10,
) => {
    const response =
        await api.get<PaginatedRentalRequests>(
            "/rentals/my-requests",
            {
                params: {
                    page,
                    limit,
                },
            },
        );

    return response.data;
};

/* =========================================================
   Get Owner's Rental Requests
========================================================= */

export const getOwnerRentalRequests = async (
    page = 1,
    limit = 10,
) => {
    const response =
        await api.get<PaginatedRentalRequests>(
            "/rentals/owner/requests",
            {
                params: {
                    page,
                    limit,
                },
            },
        );

    return response.data;
};

/* =========================================================
   Get Single Rental Request
========================================================= */

export const getRentalRequestById = async (
    rentalRequestId: string,
) => {
    const response =
        await api.get<RentalRequest>(
            `/rentals/request/${rentalRequestId}`,
        );

    return response.data;
};

/* =========================================================
   Owner Accept / Reject Rental Request
========================================================= */

export const updateRentalRequestStatus = async (
    rentalRequestId: string,
    action: "ACCEPT" | "REJECT",
) => {
    const response =
        await api.patch<RentalRequest>(
            `/rentals/${rentalRequestId}/status`,
            {
                action,
            },
        );

    return response.data;
};

/* =========================================================
   Renter's Active Request for a Product
========================================================= */

export interface ActiveRentalRequestInfo {
    exists: boolean;
    rentalRequestId?: string | null;
    status?:
        | "PENDING"
        | "NEGOTIATING"
        | "PRICE_AGREED"
        | "REJECTED"
        | "EXPIRED"
        | "APPROVED"
        | "CHARGES_PROPOSED"
        | null;
}

export const getRenterActiveRequestForProduct =
    async (productId: string) => {
        const response =
            await api.get<ActiveRentalRequestInfo>(
                `/rentals/my-requests/active/${productId}`,
            );

        return response.data;
    };

/* =========================================================
   Create Negotiation Offer
========================================================= */

export const createNegotiationOffer = async (
    payload: CreateNegotiationOfferPayload,
) => {
    const response =
        await api.post<NegotiationOffer>(
            "/rentals/negotiation/offer",
            payload,
        );

    return response.data;
};

/* =========================================================
   Get Negotiation History
========================================================= */

export const getNegotiationHistory = async (
    rentalRequestId: string,
) => {
    const response =
        await api.get<NegotiationOffer[]>(
            `/rentals/negotiation/${rentalRequestId}`,
        );

    return response.data;
};

/* =========================================================
   Accept / Reject Negotiation Offer
========================================================= */

export const updateNegotiationOffer = async (
    offerId: string,
    action: "ACCEPT" | "REJECT",
) => {
    const response =
        await api.patch<NegotiationOffer>(
            `/rentals/negotiation/offer/${offerId}`,
            {
                action,
            },
        );

    return response.data;
};

/* =========================================================
   Moderator - Price-Agreed Review Queue
========================================================= */

export const getModeratorRentalRequests = async (
    page = 1,
    limit = 10,
) => {
    const response =
        await api.get<PaginatedRentalRequests>(
            "/rentals/moderator/requests",
            {
                params: {
                    page,
                    limit,
                },
            },
        );

    return response.data;
};

/* =========================================================
   Renter - Confirm / Reject After Owner Acceptance
========================================================= */

export const renterRentalRequestAction = async (
    rentalRequestId: string,
    action: "CONFIRM" | "REJECT",
) => {
    const response =
        await api.patch<RentalRequest>(
            `/rentals/${rentalRequestId}/renter-action`,
            {
                action,
            },
        );

    return response.data;
};

/* =========================================================
   Owner / Renter - Reject After Moderator Approval
========================================================= */

export const rejectAfterApproval = async (
    rentalRequestId: string,
    action: "ACCEPT" | "REJECT",
) => {
    const response =
        await api.patch<RentalRequest>(
            `/rentals/${rentalRequestId}/reject-after-approval`,
            {
                action,
            },
        );

    return response.data;
};

/* =========================================================
   Owner / Renter - Accept / Reject Proposed Charges
========================================================= */

export const ownerAcceptCharges = async (
    rentalRequestId: string,
    action: "ACCEPT" | "REJECT",
) => {
    const response =
        await api.patch<RentalRequest>(
            `/rentals/${rentalRequestId}/owner-charges`,
            {
                action,
            },
        );

    return response.data;
};

export const renterAcceptCharges = async (
    rentalRequestId: string,
    action: "ACCEPT" | "REJECT",
) => {
    const response =
        await api.patch<RentalRequest>(
            `/rentals/${rentalRequestId}/renter-charges`,
            {
                action,
            },
        );

    return response.data;
};

/* =========================================================
   Actual Rental (Phase 11)
========================================================= */

export interface ActualRental {
    rentalId: string;
    rentalRequestId: string;

    productId: string;
    renterId: string;
    ownerId: string;

    startDate: string;
    rentalDays: number;
    endDate: string;

    agreedPricePerDay: string;
    deliveryFee: string;
    rentalAmount: string;
    platformCommissionRate: string;
    platformCommissionAmount: string;
    totalPayable: string;

    pickupAddress: string;
    deliveryAddress: string;
    contactPhone: string;

    status:
        | "PENDING_HANDOVER"
        | "ACTIVE"
        | "COMPLETED"
        | "CANCELLED";

    createdAt: string;

    riderId?: string | null;

    ownerRentalFee?: string;
    ownerDeliveryFee?: string;
    renterRentalFee?: string;
    renterDeliveryFee?: string;
    ownerTotalPayable?: string;
    renterTotalPayable?: string;
}

export const createActualRental = async (
    rentalRequestId: string,
) => {
    const response =
        await api.post<ActualRental>(
            `/rentals/moderator/request/${rentalRequestId}/create-rental`,
        );

    return response.data;
};

export const getActualRentalForRequest = async (
    rentalRequestId: string,
) => {
    try {
        const response =
            await api.get<ActualRental>(
                `/rentals/rental/request/${rentalRequestId}`,
            );

        return response.data;
    } catch (literal_error) {
        if (
            isAxiosError(literal_error) &&
            literal_error.response?.status === 404
        ) {
            return null;
        }

        throw literal_error;
    }
};

/* =========================================================
   Manual Cash Payment (Phase 12)
========================================================= */

export interface RentalPaymentInfo {
    rentalId: string;
    riderId?: string | null;
    renterId: string;
    ownerId: string;
    payment: {
        paymentId: string;
        rentalId: string;
        amount: string;
        method: string;
        status:
            | "PENDING"
            | "COLLECTED_BY_RIDER"
            | "DELIVERED_TO_OWNER"
            | "CONFIRMED";
        collectedById?: string | null;
        collectedAt?: string | null;
        deliveredAt?: string | null;
        confirmedAt?: string | null;
    };
}

export interface RiderPaymentTask {
    paymentId: string;
    rentalId: string;
    amount: string;
    method: string;
    status: string;
    rental: {
        rentalId: string;
        startDate: string;
        endDate: string;
        totalPayable: string;
        deliveryAddress: string;
        pickupAddress: string;
    };
    request: {
        productId: string;
        renterId: string;
        ownerId: string;
        contactPhone: string;
    };
}

export const getMyPaymentTasks = async () => {
    const response =
        await api.get<RiderPaymentTask[]>(
            "/rentals/my-payment-tasks",
        );

    return response.data;
};

export const markPaymentCollected = async (
    paymentId: string,
) => {
    const response =
        await api.patch<{
            status: string;
            collectedAt?: string | null;
        }>(
            `/rentals/payment/${paymentId}/collect`,
        );

    return response.data;
};

export interface PaymentStatusUpdate {
    status: string;
    collectedAt?: string | null;
}

export const markPaymentDelivered = async (
    paymentId: string,
) => {
    const response =
        await api.patch<{
            status: string;
        }>(
            `/rentals/payment/${paymentId}/deliver`,
        );

    return response.data;
};

export const confirmPaymentReceived = async (
    paymentId: string,
) => {
    const response =
        await api.patch<{
            status: string;
        }>(
            `/rentals/payment/${paymentId}/confirm`,
        );

    return response.data;
};

export const getPaymentForRequest = async (
    rentalRequestId: string,
) => {
    try {
        const response =
            await api.get<RentalPaymentInfo>(
                `/rentals/payment/request/${rentalRequestId}`,
            );

        return response.data;
    } catch (literal_error) {
        if (
            isAxiosError(literal_error) &&
            literal_error.response?.status === 404
        ) {
            return null;
        }

        throw literal_error;
    }
};

/* =========================================================
   Moderator - Approve / Reject Rental Request
========================================================= */

export interface ReviewRentalRequestPayload {
    action: "APPROVE" | "REJECT";
    deliveryFee?: number;
    platformCommissionRate?: number;
    riderId?: string;
}

export const reviewRentalRequest = async (
    rentalRequestId: string,
    payload: ReviewRentalRequestPayload,
) => {
    const response =
        await api.patch<RentalRequest>(
            `/rentals/moderator/request/${rentalRequestId}/review`,
            payload,
        );

    return response.data;
};

/* =========================================================
   Moderator - Rider List
========================================================= */

export const getRiders = async () => {
    const response =
        await api.get<RiderInfo[]>(
            "/users/riders",
        );

    return response.data;
};

/* =========================================================
   Moderator - Receiving (Pickup) Condition Review
========================================================= */

export const submitPickupReview = async (
    rentalRequestId: string,
    payload: {
        pickupConditionApproved: boolean;
        pickupReviewNote?: string;
    },
) => {
    const response =
        await api.patch<RentalRequest>(
            `/rentals/moderator/request/${rentalRequestId}/pickup-review`,
            payload,
        );

    return response.data;
};

/* =========================================================
   Moderator - Return Condition Review
========================================================= */

export const submitReturnReview = async (
    rentalRequestId: string,
    payload: {
        returnConditionApproved: boolean;
        returnReviewNote?: string;
    },
) => {
    const response =
        await api.patch<RentalRequest>(
            `/rentals/moderator/request/${rentalRequestId}/return-review`,
            payload,
        );

    return response.data;
};

/* =========================================================
   User Management - Admin/Moderator
========================================================= */

export interface UserInfo {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    emailVerificationStatus: boolean;
    createdAt: string;
    updatedAt: string;
    address?: string;
    latitude?: string;
    longitude?: string;
}

export interface RentalLog {
    rentalRequestId: string;
    productName: string;
    productId: string;
    renterName: string;
    renterId: string;
    ownerName: string;
    ownerId: string;
    startDate: string;
    endDate: string;
    rentalDays: number;
    status: string;
    agreedPricePerDay: string;
    createdAt: string;
    actualRentalStatus: string | null;
    actualRentalId: string | null;
}

export const getAllUsers = async (
    page = 1,
    limit = 10,
) => {
    const response =
        await api.get<{
            data: UserInfo[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>(
            "/users/all",
            {
                params: {
                    page,
                    limit,
                },
            },
        );

    return response.data;
};

export const toggleUserStatus = async (
    userId: string,
    status: string,
) => {
    const response =
        await api.patch<{
            userId: string;
            status: string;
            firstName: string;
            lastName: string;
            email: string;
            role: string;
        }>(
            `/users/${userId}/status`,
            {
                status,
            },
        );

    return response.data;
};

export const getAllRentalLogs = async (
    page = 1,
    limit = 10,
) => {
    const response =
        await api.get<{
            data: RentalLog[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>(
            "/users/rental-logs",
            {
                params: {
                    page,
                    limit,
                },
            },
        );

    return response.data;
};

/* =========================================================
   User Profile - Self Service
========================================================= */

export const getMyProfile = async () => {
    const response =
        await api.get<UserInfo>(
            "/users/me",
        );

    return response.data;
};

export const updateMyProfile = async (
    payload: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        address?: string;
        latitude?: string;
        longitude?: string;
    },
) => {
    const response =
        await api.patch<UserInfo>(
            "/users/me",
            payload,
        );

    return response.data;
};

export const updateMyPassword = async (
    payload: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    },
) => {
    const response =
        await api.patch<{ message: string }>(
            "/users/me/password",
            payload,
        );

    return response.data;
};

export const getMyDocument = async () => {
    const response =
        await api.get<any>(
            "/users/me/document",
        );

    return response.data;
};

export const uploadMyDocument = async (
    formData: FormData,
) => {
    const response =
        await api.post<{ message: string }>(
            "/users/me/document",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
        );

    return response.data;
};

/* =========================================================
   Moderator - Dashboard Stats
========================================================= */

export interface ModeratorDashboardStats {
    totalRentals: number;
    activeRentals: number;
    pendingHandoverRentals: number;
    completedRentals: number;
    pendingReviews: number;
}

export const getModeratorDashboardStats = async () => {
    const response =
        await api.get<ModeratorDashboardStats>(
            "/rentals/moderator/dashboard",
        );

    return response.data;
};

export const cleanupCompletedRentals = async () => {
    const response =
        await api.delete<{
            deletedRentals: number;
            cutoffDate: string;
        }>("/rentals/moderator/cleanup-completed");

    return response.data;
};

/* =========================================================
   Rider Charge Collection Tasks
========================================================= */

export interface RiderChargeCollectionTask {
    chargeId: string;
    rentalId: string;
    rentalRequestId: string;
    amount: string;
    method: string;
    status: string;
    rental: {
        rentalId: string;
        startDate: string;
        endDate: string;
        totalPayable: string;
        deliveryAddress: string;
        pickupAddress: string;
    };
    request: {
        productId: string;
        renterId: string;
        ownerId: string;
        contactPhone: string;
    };
    payerName: string;
    payerRole: string;
    type: string;
    productName: string;
    dueStage: string;
    pickupAddress: string;
    deliveryAddress: string;
}

export interface RentalChargeRecord {
    chargeId: string;
    rentalId: string;
    amount: string;
    method: string;
    status: string;
    payerRole: string;
    type: string;
    paymentMethod: string;
    collectedAt: string | null;
    verificationNote: string | null;
}

export const getMyRentalChargeTasks = async () => {
    const response =
        await api.get<RiderChargeCollectionTask[]>(
            "/rentals/my-charge-collection-tasks",
        );

    return response.data;
};

export const recordRentalChargeCollection = async (
    chargeId: string,
) => {
    const response =
        await api.post<RiderChargeCollectionTask>(
            `/rentals/charge/${chargeId}/collect`,
        );

    return response.data;
};

export const getRentalChargesForRequest = async (
    rentalRequestId: string,
    userId: string,
    userRole: string,
) => {
    const response =
        await api.get<RentalChargeRecord[]>(
            `/rentals/charges/request/${rentalRequestId}`,
        );

    return response.data;
};

export const reviewRentalChargeCollection = async (
    chargeId: string,
    payload: {
        approved: boolean;
        note?: string;
    },
) => {
    const response =
        await api.patch<RiderChargeCollectionTask>(
            `/rentals/charge/${chargeId}/review`,
            payload,
        );

    return response.data;
};

/* =========================================================
   User - Forgot Password / Reset Password
========================================================= */

export const forgotPassword = async (
    email: string,
) => {
    const response =
        await api.post<{ message: string }>(
            "/users/forgot-password",
            { email },
        );

    return response.data;
};

export const resetPassword = async (
    payload: {
        email: string;
        verificationCode: string;
        newPassword: string;
    },
) => {
    const response =
        await api.patch<{ message: string }>(
            "/users/reset-password",
            payload,
        );

    return response.data;
};
