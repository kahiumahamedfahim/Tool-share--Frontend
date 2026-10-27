import api from "./axios";
import { isAxiosError } from "axios";

/* =========================================================
   Phase 13 — Handover / Chain of Custody Types
========================================================= */

export type HandoverStage =
    | "OWNER_HANDOVER"
    | "WAREHOUSE_IN"
    | "DELIVERED_TO_RENTER"
    | "RETURN_PICKUP"
    | "RETURN_WAREHOUSE_IN"
    | "OWNER_RETURN";

export type HandoverCheckpointStatus =
    | "PENDING"
    | "VERIFIED"
    | "REJECTED";

export interface HandoverCheckpointMedia {
    mediaType: "PHOTO" | "VIDEO";
    fileUrl: string;
    createdAt: string;
}

export interface HandoverCheckpoint {
    checkpointId: string;
    stage: HandoverStage;
    stageLabel: string;
    status: HandoverCheckpointStatus;

    isEarlyReturn: boolean;
    earlyReturnApproved: boolean | null;

    note?: string | null;

    actor: {
        userId: string;
        name: string;
    };

    verifiedBy: {
        userId: string;
        name: string;
        role?: string;
    } | null;

    createdAt: string;
    verifiedAt: string | null;

    media: HandoverCheckpointMedia[];
}

export interface CustodyTimeline {
    rentalId: string;
    rentalStatus:
        | "PENDING_HANDOVER"
        | "ACTIVE"
        | "COMPLETED"
        | "CANCELLED";

    startDate: string;
    endDate: string;

    nextStage: HandoverStage | null;
    complete: boolean;

    product: {
        productId: string;
        name: string;
    } | null;

    checkpoints: HandoverCheckpoint[];
}

/* =========================================================
   Rider Handover Task
========================================================= */

export interface RiderHandoverTask {
    rentalId: string;
    rentalRequestId: string;

    status:
        | "PENDING_HANDOVER"
        | "ACTIVE"
        | "COMPLETED"
        | "CANCELLED";

    nextStage: HandoverStage;
    nextStageLabel: string;

    startDate: string;
    endDate: string;
    totalPayable: string;

    pickupAddress: string;
    deliveryAddress: string;
    contactPhone: string;

    product: {
        productId: string;
        name: string;
    } | null;

    renter: {
        userId: string;
        name: string;
        email: string;
    } | null;

    owner: {
        userId: string;
        name: string;
        email: string;
    } | null;

    pendingCheckpoint: {
        stage: HandoverStage;
        isEarlyReturn: boolean;
        earlyReturnApproved: boolean | null;
    } | null;
}

export interface HandoverRiderAssignment {
    assignmentId: string;
    rentalId: string;
    stage: HandoverStage;
    riderId: string;
    assignedById: string;
    assignedAt: string;
}

export interface HandoverRiderAssignments {
    rentalId: string;
    nextStage: HandoverStage | null;
    assignmentLocked: boolean;
    assignments: HandoverRiderAssignment[];
}

/* =========================================================
   Get Custody Timeline
   Visible to BOTH the owner and the renter
   (plus the rider and moderators).
========================================================= */

export const getCustodyTimeline = async (
    rentalId: string,
) => {
    const response =
        await api.get<CustodyTimeline>(
            `/rentals/handover/${rentalId}/checkpoints`,
        );

    return response.data;
};

/* =========================================================
   Rider — My Handover Tasks
========================================================= */

export const getMyHandoverTasks = async () => {
    const response =
        await api.get<RiderHandoverTask[]>(
            "/rentals/handover/my-tasks",
        );

    return response.data;
};

export const getHandoverRiderAssignments = async (rentalId: string) => {
    const response = await api.get<HandoverRiderAssignments>(
        `/rentals/handover/${rentalId}/assignments`,
    );
    return response.data;
};

export const assignRiderToHandoverStage = async (
    rentalId: string,
    stage: HandoverStage,
    riderId: string,
) => {
    const response = await api.patch<HandoverRiderAssignment>(
        `/rentals/handover/${rentalId}/stage/${stage}/assign-rider`,
        { riderId },
    );
    return response.data;
};

/* =========================================================
   Rider — Submit Stage Media
   multipart/form-data:
     media: File[]  (1–6 photos + max 1 video)
========================================================= */

export const submitHandoverMedia = async (
    rentalId: string,
    stage: HandoverStage,
    files: File[],
) => {
    const formData = new FormData();

    files.forEach((file) => {
        formData.append("media", file);
    });

    const response =
        await api.post<HandoverCheckpoint>(
            `/rentals/handover/${rentalId}/stage/${stage}/media`,
            formData,
            {
                headers: {
                    "Content-Type":
                        "multipart/form-data",
                },
            },
        );

    return response.data;
};

/* =========================================================
   Rider — Verify Stage OTP
========================================================= */

export const verifyHandoverOtp = async (
    rentalId: string,
    stage: HandoverStage,
    code: string,
) => {
    const response =
        await api.post<HandoverCheckpoint>(
            `/rentals/handover/${rentalId}/stage/${stage}/verify-otp`,
            { code },
        );

    return response.data;
};

/* =========================================================
   Rider — Resend Stage OTP
========================================================= */

export const resendHandoverOtp = async (
    rentalId: string,
    stage: HandoverStage,
) => {
    const response =
        await api.post<{ sentTo: string }>(
            `/rentals/handover/${rentalId}/stage/${stage}/resend-otp`,
        );

    return response.data;
};

/* =========================================================
   Moderator — Warehouse Gate Verdict
========================================================= */

export const submitModeratorGate = async (
    rentalId: string,
    stage: HandoverStage,
    payload: {
        approved: boolean;
        note?: string;
    },
) => {
    const response =
        await api.patch<HandoverCheckpoint>(
            `/rentals/handover/${rentalId}/stage/${stage}/gate`,
            payload,
        );

    return response.data;
};

/* =========================================================
   Moderator — Early Return Decision
========================================================= */

export const decideEarlyReturn = async (
    rentalId: string,
    payload: {
        approved: boolean;
        note?: string;
    },
) => {
    const response =
        await api.patch<HandoverCheckpoint>(
            `/rentals/handover/${rentalId}/early-return`,
            payload,
        );

    return response.data;
};

/* =========================================================
   Moderator — Submit Warehouse Media
   multipart/form-data:
     media: File[]  (photos/videos for warehouse inspection)
========================================================= */

export const submitModeratorMedia = async (
    rentalId: string,
    stage: HandoverStage,
    files: File[],
    note?: string,
) => {
    const formData = new FormData();

    files.forEach((file) => {
        formData.append("media", file);
    });

    if (note) {
        formData.append("note", note);
    }

    const response =
        await api.post<{
            checkpointId: string;
            mediaCount: number;
        }>(
            `/rentals/handover/${rentalId}/stage/${stage}/moderator-media`,
            formData,
            {
                headers: {
                    "Content-Type":
                        "multipart/form-data",
                },
            },
        );

    return response.data;
};

/* =========================================================
   Error helper
========================================================= */

export const getHandoverErrorMessage = (
    error: unknown,
    fallback: string,
) => {
    if (isAxiosError(error)) {
        const backendMessage =
            error.response?.data?.message;

        if (Array.isArray(backendMessage)) {
            return backendMessage.join(", ");
        }

        if (backendMessage) {
            return backendMessage as string;
        }
    }

    return fallback;
};
