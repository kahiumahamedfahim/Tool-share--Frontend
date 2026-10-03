"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import axios, {
  isAxiosError,
} from "axios";

import Loading from "@/app/components/Loading";
import ErrorMessage from "@/app/components/ErrorMessage";
import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";

/*
 * ============================================================
 * Types
 * ============================================================
 */

interface UserDocument {
  id: string;
  userId: string;

  profileImage: string | null;

  nidNumber: string | null;
  nidFrontImage: string | null;
  nidBackImage: string | null;

  drivingLicenseNumber: string | null;
  drivingLicenseFrontImage: string | null;
  drivingLicenseBackImage: string | null;

  vehicleImage: string | null;
  vehicleNumber: string | null;

  verificationStatus: string;

  documentVerifiedBy: string | null;
  documentVerifiedAt: string | null;

  rejectionReason: string | null;

  createdAt: string;
  updatedAt: string;
}

/*
 * ============================================================
 * Constants
 * ============================================================
 */

const API_BASE_URL =
  "http://localhost:7000";

/*
 * ============================================================
 * Component
 * ============================================================
 */

export default function ModeratorDocumentReviewPage() {
  const router = useRouter();


  const params = useParams();

  const userId =
    params.userId as string;

  /*
   * ==========================================================
   * State
   * ==========================================================
   */

  const [document, setDocument] =
    useState<UserDocument | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [showRejectModal, setShowRejectModal] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [rejectError, setRejectError] =
    useState("");
  

  /*
   * ==========================================================
   * Get Moderator Document
   * ==========================================================
   */

  const getUserDocument = async () => {
    try {
      setLoading(true);

      setApiError("");

      const response =
        await axios.get<UserDocument>(
          `${API_BASE_URL}/users/${userId}/document`,
          {
            withCredentials: true,
          },
        );

      console.log(
        "Moderator document response:",
        response.data,
      );

      setDocument(response.data);
    } catch (error) {
      console.error(
        "Error fetching moderator document:",
        error,
      );

      if (
        isAxiosError(error)
      ) {
        const message =
          error.response?.data
            ?.message;

        if (
          Array.isArray(message)
        ) {
          setApiError(
            message.join(", "),
          );
        } else {
          setApiError(
            message ||
              "Failed to load moderator document.",
          );
        }
      } else {
        setApiError(
          "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==========================================================
   * Load Document
   * ==========================================================
   */

  useEffect(() => {
    if (!userId) {
      return;
    }

    getUserDocument();
  }, [userId]);

  /*
   * ==========================================================
   * Image URL Helper
   * ==========================================================
   */

  const getImageUrl = (
    folder: string,
    filename: string | null,
  ) => {
    if (!filename) {
      return null;
    }

    return `${API_BASE_URL}/uploads/${folder}/${encodeURIComponent(
      filename,
    )}`;
  };

  /*
   * ==========================================================
   * Approve Document
   * ==========================================================
   */

  const handleApprove = async () => {
    if (!document) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to approve this moderator document?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      setApiError("");

      setSuccessMessage("");

      await axios.post(
        `${API_BASE_URL}/users/document/approve`,
        {
          userId: document.userId,
        },
        {
          withCredentials: true,
        },
      );

      setSuccessMessage(
        "Moderator document approved successfully!",
      );

      setTimeout(() => {
        router.push(
          "/moderator/pending-documents",
        );
      }, 1200);
    } catch (error) {
      console.error(
        "Error approving moderator document:",
        error,
      );

      if (
        isAxiosError(error)
      ) {
        const message =
          error.response?.data
            ?.message;

        if (
          Array.isArray(message)
        ) {
          setApiError(
            message.join(", "),
          );
        } else {
          setApiError(
            message ||
              "Failed to approve moderator document.",
          );
        }
      } else {
        setApiError(
          "Something went wrong. Please try again.",
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * ==========================================================
   * Open Reject Modal
   * ==========================================================
   */

  const openRejectModal = () => {
    setRejectionReason("");

    setRejectError("");

    setApiError("");

    setShowRejectModal(true);
  };

  /*
   * ==========================================================
   * Close Reject Modal
   * ==========================================================
   */

  const closeRejectModal = () => {
    if (actionLoading) {
      return;
    }

    setShowRejectModal(false);

    setRejectionReason("");

    setRejectError("");
  };

  /*
   * ==========================================================
   * Reject Document
   * ==========================================================
   */

  const handleReject = async () => {
    if (!document) {
      return;
    }

    const trimmedReason =
      rejectionReason.trim();

    /*
     * --------------------------------------------------------
     * Validate Reason
     * --------------------------------------------------------
     */

    if (!trimmedReason) {
      setRejectError(
        "Rejection reason is required.",
      );

      return;
    }

    if (
      trimmedReason.length < 5
    ) {
      setRejectError(
        "Rejection reason must be at least 5 characters.",
      );

      return;
    }

    if (
      trimmedReason.length > 500
    ) {
      setRejectError(
        "Rejection reason must not exceed 500 characters.",
      );

      return;
    }

    try {
      setActionLoading(true);

      setRejectError("");

      setApiError("");

      setSuccessMessage("");

      await axios.post(
        `${API_BASE_URL}/users/document/reject`,
        {
          userId: document.userId,
          rejectionReason:
            trimmedReason,
        },
        {
          withCredentials: true,
        },
      );

      setShowRejectModal(false);

      setSuccessMessage(
        "Moderator document rejected successfully!",
      );

      setTimeout(() => {
        router.push(
          "/moderator/pending-documents",
        );
      }, 1200);
    } catch (error) {
      console.error(
        "Error rejecting moderator document:",
        error,
      );

      if (
        isAxiosError(error)
      ) {
        const message =
          error.response?.data
            ?.message;

        if (
          Array.isArray(message)
        ) {
          setApiError(
            message.join(", "),
          );
        } else {
          setApiError(
            message ||
              "Failed to reject moderator document.",
          );
        }
      } else {
        setApiError(
          "Something went wrong. Please try again.",
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * ==========================================================
   * Loading State
   * ==========================================================
   */

  if (loading) {
    return (
      <Loading show={true} />
    );
  }

  /*
   * ==========================================================
   * Error State
   * ==========================================================
   */

  if (
    apiError &&
    !document
  ) {
    return (
      <ErrorMessage
        message={apiError}
        show={true}
        onClose={() =>
          router.back()
        }
      />
    );
  }

  /*
   * ==========================================================
   * Document Not Found
   * ==========================================================
   */

  if (!document) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-2xl">
            📄
          </div>

          <h1 className="mt-5 text-xl font-semibold text-zinc-900">
            Document Not Found
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            No moderator document was found for
            this user.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/moderator/pending-documents",
              )
            }
            className="mt-6 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Back to Pending Documents
          </button>

        </div>
      </main>
    );
  }

  /*
   * ==========================================================
   * Image URLs
   * ==========================================================
   */

  const profileImage =
    getImageUrl(
      "profile",
      document.profileImage,
    );

  const nidFrontImage =
    getImageUrl(
      "nid-front",
      document.nidFrontImage,
    );

  const nidBackImage =
    getImageUrl(
      "nid-back",
      document.nidBackImage,
    );

  const drivingLicenseFrontImage =
    getImageUrl(
      "driving-license-front",
      document.drivingLicenseFrontImage,
    );

  const drivingLicenseBackImage =
    getImageUrl(
      "driving-license-back",
      document.drivingLicenseBackImage,
    );

  const vehicleImage =
    getImageUrl(
      "vehicle",
      document.vehicleImage,
    );

  /*
   * ==========================================================
   * Conditional Sections
   * ==========================================================
   */

  const hasDrivingLicense =
    Boolean(
      document.drivingLicenseNumber ||
        document.drivingLicenseFrontImage ||
        document.drivingLicenseBackImage,
    );

  const hasVehicle =
    Boolean(
      document.vehicleNumber ||
        document.vehicleImage,
    );

  /*
   * ==========================================================
   * Render
   * ==========================================================
   */

  return (
      <>
    <RoleBasedNavbar  />
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ================================================== */}
        {/* Header */}
        {/* ================================================== */}

        <div className="mb-8">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/moderator/pending-documents",
              )
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
          >
            ← Back to Pending Documents
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Moderator Document Review
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    document.verificationStatus ===
                    "PENDING"
                      ? "bg-amber-50 text-amber-700"
                      : document.verificationStatus ===
                          "APPROVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {
                    document.verificationStatus
                  }
                </span>

              </div>

              <p className="mt-2 text-sm text-zinc-500">
                Carefully review the moderator's
                submitted documents before taking
                action.
              </p>

            </div>

            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">

              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Moderator ID
              </p>

              <p className="mt-1 font-semibold text-zinc-900">
                {document.userId}
              </p>

            </div>

          </div>

        </div>

        {/* ================================================== */}
        {/* API Error */}
        {/* ================================================== */}

        {apiError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

            <p className="text-sm font-medium text-red-700">
              {apiError}
            </p>

          </div>
        )}

        {/* ================================================== */}
        {/* Success */}
        {/* ================================================== */}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">

            <p className="text-sm font-medium text-emerald-700">
              {successMessage}
            </p>

          </div>
        )}

        {/* ================================================== */}
        {/* Moderator Profile */}
        {/* ================================================== */}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            {profileImage ? (
              <img
                src={profileImage}
                alt="Moderator profile"
                className="h-28 w-28 rounded-2xl object-cover ring-4 ring-zinc-100"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-zinc-100 text-3xl font-bold text-zinc-400">
                ?
              </div>
            )}

            <div className="flex-1">

              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Submitted By
              </p>

              <h2 className="mt-1 text-xl font-bold text-zinc-900">
                {document.userId}
              </h2>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">

                <span>
                  Submitted:{" "}
                  <strong className="font-medium text-zinc-700">
                    {new Date(
                      document.createdAt,
                    ).toLocaleDateString()}
                  </strong>
                </span>

                <span>
                  Last Updated:{" "}
                  <strong className="font-medium text-zinc-700">
                    {new Date(
                      document.updatedAt,
                    ).toLocaleDateString()}
                  </strong>
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* ================================================== */}
        {/* NID */}
        {/* ================================================== */}

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

          <div className="mb-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg">
                🪪
              </div>

              <div>

                <h2 className="text-lg font-bold text-zinc-900">
                  National ID Card
                </h2>

                <p className="text-sm text-zinc-500">
                  Review identity information and
                  submitted NID images.
                </p>

              </div>

            </div>

          </div>

          <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              NID Number
            </p>

            <p className="mt-1 text-base font-semibold text-zinc-900">
              {document.nidNumber ||
                "Not provided"}
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* NID Front */}

            <div>

              <p className="mb-3 text-sm font-semibold text-zinc-700">
                NID Front
              </p>

              {nidFrontImage ? (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">

                  <img
                    src={nidFrontImage}
                    alt="NID Front"
                    className="h-72 w-full object-contain"
                  />

                </div>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
                  NID front image not available
                </div>
              )}

            </div>

            {/* NID Back */}

            <div>

              <p className="mb-3 text-sm font-semibold text-zinc-700">
                NID Back
              </p>

              {nidBackImage ? (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">

                  <img
                    src={nidBackImage}
                    alt="NID Back"
                    className="h-72 w-full object-contain"
                  />

                </div>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
                  NID back image not available
                </div>
              )}

            </div>

          </div>

        </section>

        {/* ================================================== */}
        {/* Driving License */}
        {/* ================================================== */}

        {hasDrivingLicense && (
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

            <div className="mb-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-lg">
                  🚘
                </div>

                <div>

                  <h2 className="text-lg font-bold text-zinc-900">
                    Driving License
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Review driving license information.
                  </p>

                </div>

              </div>

            </div>

            {document.drivingLicenseNumber && (
              <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  License Number
                </p>

                <p className="mt-1 text-base font-semibold text-zinc-900">
                  {
                    document.drivingLicenseNumber
                  }
                </p>

              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">

              {document.drivingLicenseFrontImage &&
                drivingLicenseFrontImage && (
                  <div>

                    <p className="mb-3 text-sm font-semibold text-zinc-700">
                      License Front
                    </p>

                    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">

                      <img
                        src={
                          drivingLicenseFrontImage
                        }
                        alt="Driving License Front"
                        className="h-72 w-full object-contain"
                      />

                    </div>

                  </div>
                )}

              {document.drivingLicenseBackImage &&
                drivingLicenseBackImage && (
                  <div>

                    <p className="mb-3 text-sm font-semibold text-zinc-700">
                      License Back
                    </p>

                    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">

                      <img
                        src={
                          drivingLicenseBackImage
                        }
                        alt="Driving License Back"
                        className="h-72 w-full object-contain"
                      />

                    </div>

                  </div>
                )}

            </div>

          </section>
        )}

        {/* ================================================== */}
        {/* Vehicle */}
        {/* ================================================== */}

        {hasVehicle && (
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

            <div className="mb-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
                  🚗
                </div>

                <div>

                  <h2 className="text-lg font-bold text-zinc-900">
                    Vehicle Information
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Review submitted vehicle information.
                  </p>

                </div>

              </div>

            </div>

            {document.vehicleNumber && (
              <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Vehicle Number
                </p>

                <p className="mt-1 text-base font-semibold text-zinc-900">
                  {
                    document.vehicleNumber
                  }
                </p>

              </div>
            )}

            {vehicleImage && (
              <div>

                <p className="mb-3 text-sm font-semibold text-zinc-700">
                  Vehicle Image
                </p>

                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">

                  <img
                    src={vehicleImage}
                    alt="Vehicle"
                    className="max-h-[500px] w-full object-contain"
                  />

                </div>

              </div>
            )}

          </section>
        )}

        {/* ================================================== */}
        {/* Verification Information */}
        {/* ================================================== */}

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h2 className="text-lg font-bold text-zinc-900">
              Verification Information
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Current verification state of this
              moderator document.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Status */}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Status
              </p>

              <p className="mt-2 font-semibold text-zinc-900">
                {
                  document.verificationStatus
                }
              </p>

            </div>

            {/* Verified By */}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Verified By
              </p>

              <p className="mt-2 font-semibold text-zinc-900">
                {
                  document.documentVerifiedBy ||
                  "Not verified yet"
                }
              </p>

            </div>

            {/* Verified At */}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Verified At
              </p>

              <p className="mt-2 font-semibold text-zinc-900">
                {document.documentVerifiedAt
                  ? new Date(
                      document.documentVerifiedAt,
                    ).toLocaleString()
                  : "Not verified yet"}
              </p>

            </div>

          </div>

          {/* Rejection Reason */}

          {document.rejectionReason && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                Rejection Reason
              </p>

              <p className="mt-2 text-sm leading-6 text-red-700">
                {
                  document.rejectionReason
                }
              </p>

            </div>
          )}

        </section>

        {/* ================================================== */}
        {/* Accept / Reject */}
        {/* ================================================== */}

        {document.verificationStatus ===
          "PENDING" && (
          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="font-semibold text-zinc-900">
                  Verification Decision
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Review all submitted information
                  before making your decision.
                </p>

              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={
                    openRejectModal
                  }
                  disabled={
                    actionLoading
                  }
                  className="rounded-xl border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject
                </button>

                <button
                  type="button"
                  onClick={
                    handleApprove
                  }
                  disabled={
                    actionLoading
                  }
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading
                    ? "Processing..."
                    : "Accept Document"}
                </button>

              </div>

            </div>

          </section>
        )}

      </div>

      {/* ====================================================== */}
      {/* Reject Modal */}
      {/* ====================================================== */}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">

            {/* Modal Header */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <h2 className="text-xl font-bold text-zinc-900">
                  Reject Moderator Document
                </h2>

                <p className="mt-1 text-sm leading-5 text-zinc-500">
                  Please provide a clear reason for
                  rejecting this document.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeRejectModal
                }
                disabled={
                  actionLoading
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
              >
                ✕
              </button>

            </div>

            {/* Reason */}

            <div className="mt-6">

              <label
                htmlFor="rejectionReason"
                className="mb-2 block text-sm font-semibold text-zinc-700"
              >
                Rejection Reason
              </label>

              <textarea
                id="rejectionReason"
                value={
                  rejectionReason
                }
                onChange={(
                  event,
                ) => {
                  setRejectionReason(
                    event.target.value,
                  );

                  if (
                    rejectError
                  ) {
                    setRejectError(
                      "",
                    );
                  }
                }}
                placeholder="Example: NID front image is unclear. Please upload a clear image."
                rows={5}
                maxLength={500}
                disabled={
                  actionLoading
                }
                className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-zinc-100"
              />

              <div className="mt-2 flex items-center justify-between">

                {rejectError ? (
                  <p className="text-xs font-medium text-red-600">
                    {rejectError}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400">
                    Minimum 5 characters.
                  </p>
                )}

                <p className="text-xs text-zinc-400">
                  {
                    rejectionReason.length
                  }
                  /500
                </p>

              </div>

            </div>

            {/* Modal Actions */}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={
                  closeRejectModal
                }
                disabled={
                  actionLoading
                }
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleReject
                }
                disabled={
                  actionLoading
                }
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
    </>
  );
}