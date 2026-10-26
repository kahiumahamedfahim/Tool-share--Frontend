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

    /* =====================================================
       Moderator review decisions
    ===================================================== */

    deliveryFee?: string;

    ownerRentalFee?: string | null;
    ownerDeliveryFee?: string | null;
    renterRentalFee?: string | null;
    renterDeliveryFee?: string | null;

    platformCommissionRate?: string;

    riderId?: string | null;

    pickupConditionApproved?: boolean | null;
    pickupReviewNote?: string | null;
    moderatorPickupReviewedAt?: string | null;

    returnConditionApproved?: boolean | null;
    returnReviewNote?: string | null;
    moderatorReturnReviewedAt?: string | null;

    /* Relation data included by list/detail endpoints */

    product?: {
        productId: string;
        name: string;
        pricePerDay: string;
        negotiationAllowed: boolean;
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
   Used to prevent duplicate rental requests
   while the owner has not responded yet.
========================================================= */

export interface ActiveRentalRequestInfo {
    exists: boolean;
    rentalRequestId?: string | null;
    status?:
        | "PENDING"
        | "NEGOTIATING"
        | "PRICE_AGREED"
        | "APPROVED"
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
   Actual Rental (Phase 11)
========================================================= */

export interface ActualRental {
    rentalId: string;
    rentalRequestId: string;

    productId: string;
    renterId: string;
    ownerId: string;
    riderId?: string | null;

    startDate: string;
    rentalDays: number;
    endDate: string;

    agreedPricePerDay: string;
    deliveryFee: string;
    ownerRentalFee?: string;
    ownerDeliveryFee?: string;
    renterRentalFee?: string;
    renterDeliveryFee?: string;
    ownerTotalPayable?: string;
    renterTotalPayable?: string;
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
}

export type RentalChargeStatus =
    | "PENDING"
    | "SUBMITTED"
    | "CONFIRMED"
    | "REJECTED"
    | "NO_CHARGE";

export interface RentalChargeEvent {
    action: "SUBMITTED" | "CONFIRMED" | "REJECTED";
    actorId: string;
    paymentMethod?: "CASH" | null;
    note?: string | null;
    createdAt: string;
}

export interface RentalChargeRecord {
    chargeId: string;
    rentalId: string;
    rentalRequestId: string;
    payerId: string;
    payerRole: "OWNER" | "RENTER";
    type: "RENTAL" | "DELIVERY";
    amount: string;
    status: RentalChargeStatus;
    paymentMethod?: "CASH" | null;
    collectedById?: string | null;
    collectedAt?: string | null;
    verifiedById?: string | null;
    verifiedAt?: string | null;
    verificationNote?: string | null;
    events?: RentalChargeEvent[];
}

export interface RiderChargeCollectionTask extends RentalChargeRecord {
    payerName: string;
    productName: string;
    pickupAddress: string;
    deliveryAddress: string;
    dueStage: "DELIVERED_TO_RENTER" | "OWNER_RETURN";
}

export const getRentalChargesForRequest = async (
    rentalRequestId: string,
) => {
    const response = await api.get<RentalChargeRecord[]>(
        `/rentals/charges/request/${rentalRequestId}`,
    );
    return response.data;
};

export const getMyRentalChargeTasks = async () => {
    const response = await api.get<RiderChargeCollectionTask[]>(
        "/rentals/my-charge-collection-tasks",
    );
    return response.data;
};

export const recordRentalChargeCollection = async (chargeId: string) => {
    const response = await api.post<RentalChargeRecord>(
        `/rentals/charge/${chargeId}/collect`,
    );
    return response.data;
};

export const reviewRentalChargeCollection = async (
    chargeId: string,
    payload: { approved: boolean; note?: string },
) => {
    const response = await api.patch<RentalChargeRecord>(
        `/rentals/charge/${chargeId}/review`,
        payload,
    );
    return response.data;
};

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
        /*
         * No rental created yet — a 404 is
         * expected until the moderator creates
         * the rental. Anything else rethrows.
         */

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
   Rider collects the cash at handover, then
   hands it to the owner, who confirms.
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
        await api.patch<PaymentStatusUpdate>(
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
    ownerRentalFee?: number;
    ownerDeliveryFee?: number;
    renterRentalFee?: number;
    renterDeliveryFee?: number;
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
