"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import axios, { isAxiosError } from "axios";

import Loading from "@/app/components/Loading";
import ErrorMessage from "@/app/components/ErrorMessage";
import AdminNavbar from "@/app/components/admin/AdminNavbar";

/*
 * --------------------------------------------------
 * Types
 * --------------------------------------------------
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

interface PendingUser {
  id: string;
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

  userDocument: UserDocument;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PendingDocumentsResponse {
  data: PendingUser[];
  meta: PaginationMeta;
}

/*
 * --------------------------------------------------
 * Constants
 * --------------------------------------------------
 */

const API_BASE_URL =
  "http://localhost:7000";

/*
 * --------------------------------------------------
 * Component
 * --------------------------------------------------
 */

export default function AdminPendingDocumentsPage() {
  /*
   * --------------------------------------------------
   * Router
   * --------------------------------------------------
   */

  const router = useRouter();

  /*
   * --------------------------------------------------
   * State
   * --------------------------------------------------
   */

  const [documents, setDocuments] =
    useState<PendingUser[]>([]);

  const [meta, setMeta] =
    useState<PaginationMeta | null>(null);

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(10);

  const [loading, setLoading] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  /*
   * --------------------------------------------------
   * Fetch Pending Documents
   * --------------------------------------------------
   */

  const getPendingDocuments =
    useCallback(async () => {
      try {
        setLoading(true);
        setApiError("");

        const response =
          await axios.get<PendingDocumentsResponse>(
            `${API_BASE_URL}/users/Admin-Pending-documents`,
            {
              params: {
                page,
                limit,
              },

              withCredentials: true,
            },
          );

        console.log(
          "Pending documents response:",
          response.data,
        );

        setDocuments(
          response.data.data,
        );

        setMeta(
          response.data.meta,
        );
      } catch (error) {
        console.error(
          "Get pending documents error:",
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
                "Could not fetch pending documents.",
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
    }, [page, limit]);

  /*
   * --------------------------------------------------
   * Load Data
   * --------------------------------------------------
   */

  useEffect(() => {
    getPendingDocuments();
  }, [getPendingDocuments]);

  /*
   * --------------------------------------------------
   * Helpers
   * --------------------------------------------------
   */

  const formatDate = (
    date: string,
  ) => {
    return new Date(
      date,
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  };

  /*
   * --------------------------------------------------
   * Review Document
   * --------------------------------------------------
   */

  const handleReview = (
    userId: string,
  ) => {
    router.push(
      `/admin/pending-documents/${userId}`,
    );
  };

  /*
   * --------------------------------------------------
   * Pagination
   * --------------------------------------------------
   */

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(
        (previous) =>
          previous - 1,
      );
    }
  };

  const goToNextPage = () => {
    if (
      meta &&
      page < meta.totalPages
    ) {
      setPage(
        (previous) =>
          previous + 1,
      );
    }
  };

  const handleLimitChange = (
    value: number,
  ) => {
    setLimit(value);
    setPage(1);
  };

  /*
   * --------------------------------------------------
   * UI
   * --------------------------------------------------
   */

  return (
    <>
      {/* ================================================== */}
      {/* Loading */}
      {/* ================================================== */}

      <Loading show={loading} />

      {/* ================================================== */}
      {/* Error */}
      {/* ================================================== */}

      <ErrorMessage
        message={apiError}
        show={!!apiError}
        onClose={() =>
          setApiError("")
        }
      />

      {/* ================================================== */}
      {/* Admin Navbar */}
      {/* ================================================== */}

      <AdminNavbar />

      {/* ================================================== */}
      {/* Main */}
      {/* ================================================== */}

      <main className="min-h-screen bg-zinc-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">

          {/* ================================================== */}
          {/* Header */}
          {/* ================================================== */}

          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />

                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Admin Verification
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                Pending Documents
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Review and verify documents
                submitted by users.
              </p>
            </div>

            <button
              type="button"
              onClick={
                getPendingDocuments
              }
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {/* ================================================== */}
          {/* Summary Cards */}
          {/* ================================================== */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Pending Documents */}

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Pending Documents
                  </p>

                  <p className="mt-2 text-3xl font-bold text-zinc-900">
                    {meta?.total ?? 0}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <span className="text-lg font-bold">
                    !
                  </span>
                </div>

              </div>
            </div>

            {/* Current Page */}

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Current Page
                  </p>

                  <p className="mt-2 text-3xl font-bold text-zinc-900">
                    {meta?.page ?? 1}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <span className="text-sm font-bold">
                    #
                  </span>
                </div>

              </div>
            </div>

            {/* Total Pages */}

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Total Pages
                  </p>

                  <p className="mt-2 text-3xl font-bold text-zinc-900">
                    {meta?.totalPages ?? 0}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <span className="text-sm font-bold">
                    →
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* ================================================== */}
          {/* Verification Queue */}
          {/* ================================================== */}

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

            {/* ================================================== */}
            {/* Queue Header */}
            {/* ================================================== */}

            <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="font-semibold text-zinc-900">
                    Verification Queue
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Documents waiting for
                    admin review.
                  </p>
                </div>

                {/* Page Size */}

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="page-size"
                    className="text-sm text-zinc-500"
                  >
                    Show
                  </label>

                  <select
                    id="page-size"
                    value={limit}
                    onChange={(event) =>
                      handleLimitChange(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

                    <option value={100}>
                      100
                    </option>
                  </select>
                </div>

              </div>
            </div>

            {/* ================================================== */}
            {/* Empty State */}
            {/* ================================================== */}

            {!loading &&
              documents.length === 0 && (
                <div className="px-6 py-16 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                    <span className="text-xl font-semibold text-emerald-600">
                      ✓
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                    No Pending Documents
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                    There are currently no
                    documents waiting for
                    verification.
                  </p>

                </div>
              )}

            {/* ================================================== */}
            {/* Desktop Table */}
            {/* ================================================== */}

            {!loading &&
              documents.length > 0 && (
                <div className="hidden overflow-x-auto lg:block">

                  <table className="w-full min-w-[900px]">

                    <thead className="border-b border-zinc-200 bg-zinc-50">
                      <tr>

                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          User
                        </th>

                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          NID
                        </th>

                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Submitted
                        </th>

                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Status
                        </th>

                        <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Action
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-100">

                      {documents.map(
                        (user) => (
                          <tr
                            key={
                              user.userDocument.id
                            }
                            className="transition hover:bg-zinc-50"
                          >

                            {/* User */}

                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-semibold text-blue-600">

                                  {user.userDocument
                                    .profileImage ? (
                                    <img
                                      src={`${API_BASE_URL}/uploads/profile/${encodeURIComponent(
                                        user
                                          .userDocument
                                          .profileImage,
                                      )}`}
                                      alt={`${user.firstName} ${user.lastName}`}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    user.firstName
                                      .charAt(
                                        0,
                                      )
                                      .toUpperCase()
                                  )}

                                </div>

                                <div className="min-w-0">

                                  <p className="truncate font-medium text-zinc-900">
                                    {
                                      user.firstName
                                    }{" "}
                                    {
                                      user.lastName
                                    }
                                  </p>

                                  <p className="truncate text-xs text-zinc-500">
                                    {
                                      user.userId
                                    }
                                  </p>

                                </div>

                              </div>
                            </td>

                            {/* NID */}

                            <td className="px-6 py-5">
                              <p className="text-sm font-medium text-zinc-700">
                                {user.userDocument
                                  .nidNumber ||
                                  "Not provided"}
                              </p>
                            </td>

                            {/* Submitted */}

                            <td className="px-6 py-5">
                              <p className="text-sm text-zinc-700">
                                {formatDate(
                                  user.userDocument
                                    .createdAt,
                                )}
                              </p>
                            </td>

                            {/* Status */}

                            <td className="px-6 py-5">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">

                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                                Pending

                              </span>
                            </td>

                            {/* Action */}

                            <td className="px-6 py-5 text-right">

                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(
                                    user.userId,
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
                              >
                                Review
                              </button>

                            </td>

                          </tr>
                        ),
                      )}

                    </tbody>
                  </table>

                </div>
              )}

            {/* ================================================== */}
            {/* Mobile Cards */}
            {/* ================================================== */}

            {!loading &&
              documents.length > 0 && (
                <div className="space-y-3 p-4 lg:hidden">

                  {documents.map(
                    (user) => (
                      <div
                        key={
                          user.userDocument.id
                        }
                        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                      >

                        {/* User Header */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-semibold text-blue-600">

                              {user.userDocument
                                .profileImage ? (
                                <img
                                  src={`${API_BASE_URL}/uploads/profile/${encodeURIComponent(
                                    user
                                      .userDocument
                                      .profileImage,
                                  )}`}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="h-11 w-11 rounded-full object-cover"
                                />
                              ) : (
                                user.firstName
                                  .charAt(
                                    0,
                                  )
                                  .toUpperCase()
                              )}

                            </div>

                            <div className="min-w-0">

                              <p className="truncate font-semibold text-zinc-900">
                                {
                                  user.firstName
                                }{" "}
                                {
                                  user.lastName
                                }
                              </p>

                              <p className="truncate text-xs text-zinc-500">
                                {
                                  user.userId
                                }
                              </p>

                            </div>

                          </div>

                          {/* Status */}

                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">

                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                            Pending

                          </span>

                        </div>

                        {/* Information */}

                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4">

                          <div>
                            <p className="text-xs font-medium text-zinc-400">
                              NID
                            </p>

                            <p className="mt-1 truncate text-sm font-medium text-zinc-700">
                              {user.userDocument
                                .nidNumber ||
                                "Not provided"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-zinc-400">
                              Submitted
                            </p>

                            <p className="mt-1 text-sm font-medium text-zinc-700">
                              {formatDate(
                                user.userDocument
                                  .createdAt,
                              )}
                            </p>
                          </div>

                        </div>

                        {/* Action */}

                        <button
                          type="button"
                          onClick={() =>
                            handleReview(
                              user.userId,
                            )
                          }
                          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
                        >
                          Review Document
                        </button>

                      </div>
                    ),
                  )}

                </div>
              )}

            {/* ================================================== */}
            {/* Pagination */}
            {/* ================================================== */}

            {!loading &&
              meta &&
              meta.totalPages > 0 && (
                <div className="flex flex-col gap-4 border-t border-zinc-200 px-4 py-4 sm:px-6">

                  {/* Result Information */}

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-sm text-zinc-500">
                      Showing{" "}
                      <span className="font-medium text-zinc-700">
                        {documents.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-zinc-700">
                        {meta.total}
                      </span>{" "}
                      documents
                    </p>

                    <p className="text-xs text-zinc-400">
                      Page{" "}
                      <span className="font-medium text-zinc-600">
                        {meta.page}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-zinc-600">
                        {meta.totalPages}
                      </span>
                    </p>

                  </div>

                  {/* Pagination Controls */}

                  <div className="flex items-center justify-between gap-3 sm:justify-end">

                    <button
                      type="button"
                      onClick={
                        goToPreviousPage
                      }
                      disabled={
                        page === 1 ||
                        loading
                      }
                      className="flex-1 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                    >
                      Previous
                    </button>

                    <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white">
                      {meta.page}
                    </div>

                    <button
                      type="button"
                      onClick={
                        goToNextPage
                      }
                      disabled={
                        page ===
                          meta.totalPages ||
                        loading
                      }
                      className="flex-1 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                    >
                      Next
                    </button>

                  </div>

                </div>
              )}

          </div>

        </div>
      </main>
    </>
  );
}