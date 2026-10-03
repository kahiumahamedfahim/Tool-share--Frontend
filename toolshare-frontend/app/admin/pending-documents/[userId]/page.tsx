"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import axios, { isAxiosError } from "axios";

import Loading from "@/app/components/Loading";

import ErrorMessage from "@/app/components/ErrorMessage";

import AdminNavbar from "@/app/components/admin/AdminNavbar";

/*
 * ============================================================
 * USER DOCUMENT INTERFACE
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
 * API
 * ============================================================
 */

const API_BASE_URL =
  "http://localhost:7000";

/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function AdminDocumentReviewPage() {
  /*
   * ============================================================
   * ROUTER
   * ============================================================
   */

  const router = useRouter();

  const params = useParams();

  const userId =
    params.userId as string;

  /*
   * ============================================================
   * DOCUMENT STATE
   * ============================================================
   */

  const [document, setDocument] =
    useState<UserDocument | null>(null);

  const [loading, setLoading] =
    useState(true);

  /*
   * ============================================================
   * ACTION STATE
   * ============================================================
   */

  const [actionLoading, setActionLoading] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /*
   * ============================================================
   * REJECT STATE
   * ============================================================
   */

  const [showRejectModal, setShowRejectModal] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [rejectError, setRejectError] =
    useState("");

  /*
   * ============================================================
   * GET USER DOCUMENT
   * ============================================================
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
        "Document response:",
        response.data,
      );

      setDocument(response.data);
    } catch (error) {
      console.error(
        "Error fetching user document:",
        error,
      );

      if (isAxiosError(error)) {
        const message =
          error.response?.data?.message;

        if (Array.isArray(message)) {
          setApiError(
            message.join(", "),
          );
        } else {
          setApiError(
            message ||
              "Failed to load user document.",
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
   * ============================================================
   * FETCH DOCUMENT
   * ============================================================
   */

  useEffect(() => {
    if (!userId) {
      return;
    }

    getUserDocument();
  }, [userId]);

  /*
   * ============================================================
   * IMAGE URL HELPER
   * ============================================================
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
   * ============================================================
   * ACCEPT DOCUMENT
   * ============================================================
   */

  const handleApprove = async () => {
    if (!document) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to approve this document?",
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
        "Document approved successfully!",
      );

      setTimeout(() => {
        router.push(
          "/admin/pending-documents",
        );
      }, 1200);
    } catch (error) {
      console.error(
        "Error approving document:",
        error,
      );

      if (isAxiosError(error)) {
        const message =
          error.response?.data?.message;

        if (Array.isArray(message)) {
          setApiError(
            message.join(", "),
          );
        } else {
          setApiError(
            message ||
              "Failed to approve document.",
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
   * ============================================================
   * OPEN REJECT MODAL
   * ============================================================
   */

  const openRejectModal = () => {
    setRejectionReason("");

    setRejectError("");

    setApiError("");

    setShowRejectModal(true);
  };

  /*
   * ============================================================
   * CLOSE REJECT MODAL
   * ============================================================
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
   * ============================================================
   * REJECT DOCUMENT
   * ============================================================
   */

  const handleReject = async () => {
    if (!document) {
      return;
    }

    const trimmedReason =
      rejectionReason.trim();

    /*
     * ----------------------------------------------------------
     * VALIDATION
     * ----------------------------------------------------------
     */

    if (!trimmedReason) {
      setRejectError(
        "Rejection reason is required.",
      );

      return;
    }

    if (trimmedReason.length < 5) {
      setRejectError(
        "Rejection reason must be at least 5 characters.",
      );

      return;
    }

    if (trimmedReason.length > 500) {
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
          rejectionReason: trimmedReason,
        },
        {
          withCredentials: true,
        },
      );

      setShowRejectModal(false);

      setSuccessMessage(
        "Document rejected successfully!",
      );

      setTimeout(() => {
        router.push(
          "/admin/pending-documents",
        );
      }, 1200);
    } catch (error) {
      console.error(
        "Error rejecting document:",
        error,
      );

      if (isAxiosError(error)) {
        const message =
          error.response?.data?.message;

        if (Array.isArray(message)) {
          setApiError(
            message.join(", "),
          );
        } else {
          setApiError(
            message ||
              "Failed to reject document.",
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
   * ============================================================
   * IMAGE URLS
   * ============================================================
   */

  const profileImage = document
    ? getImageUrl(
        "profile",
        document.profileImage,
      )
    : null;

  const nidFrontImage = document
    ? getImageUrl(
        "nid-front",
        document.nidFrontImage,
      )
    : null;

  const nidBackImage = document
    ? getImageUrl(
        "nid-back",
        document.nidBackImage,
      )
    : null;

  const drivingLicenseFrontImage =
    document
      ? getImageUrl(
          "driving-license-front",
          document.drivingLicenseFrontImage,
        )
      : null;

  const drivingLicenseBackImage =
    document
      ? getImageUrl(
          "driving-license-back",
          document.drivingLicenseBackImage,
        )
      : null;

  const vehicleImage = document
    ? getImageUrl(
        "vehicle",
        document.vehicleImage,
      )
    : null;

  /*
   * ============================================================
   * OPTIONAL DOCUMENT CHECKS
   * ============================================================
   */

  const hasDrivingLicense =
    document
      ? Boolean(
          document.drivingLicenseNumber ||
            document.drivingLicenseFrontImage ||
            document.drivingLicenseBackImage,
        )
      : false;

  const hasVehicle =
    document
      ? Boolean(
          document.vehicleNumber ||
            document.vehicleImage,
        )
      : false;

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <>
        <AdminNavbar />

        <Loading show={true} />
      </>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (apiError && !document) {
    return (
      <>
        <AdminNavbar />

        <ErrorMessage
          message={apiError}
          show={true}
          onClose={() => router.back()}
        />
      </>
    );
  }

  /*
   * ============================================================
   * DOCUMENT NOT FOUND
   * ============================================================
   */

  if (!document) {
    return (
      <>
        <AdminNavbar />

        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 px-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-2xl">
              📄
            </div>

            <h1 className="mt-5 text-xl font-semibold text-zinc-900">
              Document Not Found
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              No document was found for
              this user.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/pending-documents",
                )
              }
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Back to Pending Documents
            </button>

          </div>
        </main>
      </>
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <>
      {/* ====================================================== */}
      {/* ADMIN NAVBAR */}
      {/* ====================================================== */}

      <AdminNavbar />

      <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">

          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="mb-8">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/pending-documents",
                )
              }
              className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-white hover:text-zinc-900"
            >
              ← Back to Pending Documents
            </button>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />

                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Admin Verification
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">

                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                    Document Review
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
                    {document.verificationStatus}
                  </span>

                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  Carefully review the submitted
                  documents before making a
                  verification decision.
                </p>

              </div>

              <div className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:w-auto">

                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  User ID
                </p>

                <p className="mt-1 break-all font-semibold text-zinc-900">
                  {document.userId}
                </p>

              </div>

            </div>
          </div>

          {/* ================================================== */}
          {/* ACTION ERROR */}
          {/* ================================================== */}

          {apiError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-start gap-3">

                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                  !
                </div>

                <p className="text-sm font-medium leading-6 text-red-700">
                  {apiError}
                </p>

              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* SUCCESS MESSAGE */}
          {/* ================================================== */}

          {successMessage && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-start gap-3">

                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
                  ✓
                </div>

                <p className="text-sm font-medium leading-6 text-emerald-700">
                  {successMessage}
                </p>

              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* PROFILE / USER INFORMATION */}
          {/* ================================================== */}

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              {/* PROFILE IMAGE */}

              {profileImage ? (
                <img
                  src={profileImage}
                  alt="User profile"
                  className="h-24 w-24 rounded-2xl object-cover ring-4 ring-zinc-100 sm:h-28 sm:w-28"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-bold text-blue-500 sm:h-28 sm:w-28">
                  ?
                </div>
              )}

              {/* USER DETAILS */}

              <div className="min-w-0 flex-1">

                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Submitted By
                </p>

                <h2 className="mt-1 break-all text-xl font-bold text-zinc-900">
                  {document.userId}
                </h2>

                <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:flex-wrap sm:gap-x-6">

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
          {/* NID SECTION */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">

            {/* SECTION HEADER */}

            <div className="mb-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
                  🪪
                </div>

                <div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    National ID Card
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Review identity information
                    and submitted NID images.
                  </p>
                </div>

              </div>

            </div>

            {/* NID NUMBER */}

            <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                NID Number
              </p>

              <p className="mt-1 break-all text-base font-semibold text-zinc-900">
                {document.nidNumber ||
                  "Not provided"}
              </p>

            </div>

            {/* NID IMAGES */}

            <div className="grid gap-6 md:grid-cols-2">

              {/* FRONT */}

              <div>
                <p className="mb-3 text-sm font-semibold text-zinc-700">
                  NID Front
                </p>

                {nidFrontImage ? (
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                    <img
                      src={nidFrontImage}
                      alt="NID Front"
                      className="h-64 w-full object-contain sm:h-72"
                    />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 text-center text-sm text-zinc-400 sm:h-72">
                    NID front image not
                    available
                  </div>
                )}
              </div>

              {/* BACK */}

              <div>
                <p className="mb-3 text-sm font-semibold text-zinc-700">
                  NID Back
                </p>

                {nidBackImage ? (
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                    <img
                      src={nidBackImage}
                      alt="NID Back"
                      className="h-64 w-full object-contain sm:h-72"
                    />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 text-center text-sm text-zinc-400 sm:h-72">
                    NID back image not
                    available
                  </div>
                )}
              </div>

            </div>

          </section>

          {/* ================================================== */}
          {/* DRIVING LICENSE */}
          {/* ================================================== */}

          {hasDrivingLicense && (
            <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">

              {/* SECTION HEADER */}

              <div className="mb-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-lg">
                    🚘
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">
                      Driving License
                    </h2>

                    <p className="text-sm text-zinc-500">
                      Review driving license
                      information.
                    </p>
                  </div>

                </div>

              </div>

              {/* LICENSE NUMBER */}

              {document.drivingLicenseNumber && (
                <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    License Number
                  </p>

                  <p className="mt-1 break-all text-base font-semibold text-zinc-900">
                    {
                      document.drivingLicenseNumber
                    }
                  </p>

                </div>
              )}

              {/* LICENSE IMAGES */}

              <div className="grid gap-6 md:grid-cols-2">

                {/* FRONT */}

                {document.drivingLicenseFrontImage && (
                  <div>

                    <p className="mb-3 text-sm font-semibold text-zinc-700">
                      License Front
                    </p>

                    {drivingLicenseFrontImage && (
                      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                        <img
                          src={
                            drivingLicenseFrontImage
                          }
                          alt="Driving License Front"
                          className="h-64 w-full object-contain sm:h-72"
                        />
                      </div>
                    )}

                  </div>
                )}

                {/* BACK */}

                {document.drivingLicenseBackImage && (
                  <div>

                    <p className="mb-3 text-sm font-semibold text-zinc-700">
                      License Back
                    </p>

                    {drivingLicenseBackImage && (
                      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                        <img
                          src={
                            drivingLicenseBackImage
                          }
                          alt="Driving License Back"
                          className="h-64 w-full object-contain sm:h-72"
                        />
                      </div>
                    )}

                  </div>
                )}

              </div>

            </section>
          )}

          {/* ================================================== */}
          {/* VEHICLE */}
          {/* ================================================== */}

          {hasVehicle && (
            <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">

              {/* SECTION HEADER */}

              <div className="mb-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">
                    🚗
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">
                      Vehicle Information
                    </h2>

                    <p className="text-sm text-zinc-500">
                      Review submitted vehicle
                      information.
                    </p>
                  </div>

                </div>

              </div>

              {/* VEHICLE NUMBER */}

              {document.vehicleNumber && (
                <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Vehicle Number
                  </p>

                  <p className="mt-1 break-all text-base font-semibold text-zinc-900">
                    {document.vehicleNumber}
                  </p>

                </div>
              )}

              {/* VEHICLE IMAGE */}

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
          {/* VERIFICATION INFORMATION */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">

            {/* HEADER */}

            <div className="mb-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                  ✓
                </div>

                <div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    Verification Information
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Current verification state of
                    this document.
                  </p>
                </div>

              </div>

            </div>

            {/* INFORMATION GRID */}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {/* STATUS */}

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Status
                </p>

                <div className="mt-2">

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
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

              </div>

              {/* VERIFIED BY */}

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Verified By
                </p>

                <p className="mt-2 break-all font-semibold text-zinc-900">
                  {document.documentVerifiedBy ||
                    "Not verified yet"}
                </p>

              </div>

              {/* VERIFIED AT */}

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Verified At
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {document.documentVerifiedAt
                    ? new Date(
                        document.documentVerifiedAt,
                      ).toLocaleString()
                    : "Not verified yet"}
                </p>

              </div>

            </div>

            {/* REJECTION REASON */}

            {document.rejectionReason && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                    !
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                      Rejection Reason
                    </p>

                    <p className="mt-2 text-sm leading-6 text-red-700">
                      {
                        document.rejectionReason
                      }
                    </p>

                  </div>

                </div>

              </div>
            )}

          </section>

          {/* ================================================== */}
          {/* VERIFICATION DECISION */}
          {/* ================================================== */}

          {document.verificationStatus ===
            "PENDING" && (
            <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex flex-col gap-5">

                {/* HEADER */}

                <div>

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      ✓
                    </div>

                    <div>

                      <h2 className="font-semibold text-zinc-900">
                        Verification Decision
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        Review all submitted
                        information before making
                        your decision.
                      </p>

                    </div>

                  </div>

                </div>

                {/* ACTION BUTTONS */}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  {/* REJECT */}

                  <button
                    type="button"
                    onClick={
                      openRejectModal
                    }
                    disabled={
                      actionLoading
                    }
                    className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>

                  {/* ACCEPT */}

                  <button
                    type="button"
                    onClick={
                      handleApprove
                    }
                    disabled={
                      actionLoading
                    }
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* ================================================== */}
        {/* REJECT MODAL */}
        {/* ================================================== */}

        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6 backdrop-blur-sm">

            <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6">

              {/* MODAL HEADER */}

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      !
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-zinc-900">
                        Reject Document
                      </h2>

                      <p className="mt-1 text-sm leading-5 text-zinc-500">
                        Please provide a clear
                        reason for rejecting this
                        document.
                      </p>
                    </div>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    closeRejectModal
                  }
                  disabled={
                    actionLoading
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
                >
                  ✕
                </button>

              </div>

              {/* REASON */}

              <div className="mt-6">

                <label
                  htmlFor="rejectionReason"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Rejection Reason
                </label>

                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(event) => {
                    setRejectionReason(
                      event.target.value,
                    );

                    if (rejectError) {
                      setRejectError("");
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

                <div className="mt-2 flex items-start justify-between gap-3">

                  {rejectError ? (
                    <p className="text-xs font-medium text-red-600">
                      {rejectError}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      Minimum 5 characters.
                    </p>
                  )}

                  <p className="shrink-0 text-xs text-zinc-400">
                    {
                      rejectionReason.length
                    }
                    /500
                  </p>

                </div>

              </div>

              {/* MODAL ACTIONS */}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                {/* CANCEL */}

                <button
                  type="button"
                  onClick={
                    closeRejectModal
                  }
                  disabled={
                    actionLoading
                  }
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                {/* CONFIRM REJECTION */}

                <button
                  type="button"
                  onClick={
                    handleReject
                  }
                  disabled={
                    actionLoading
                  }
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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