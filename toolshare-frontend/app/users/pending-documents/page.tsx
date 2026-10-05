"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

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

interface UserPendingDocumentsResponse {
  data: PendingUser[];

  meta: PaginationMeta;
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

export default function UserPendingDocumentsPage() {
  const router = useRouter();

  /*
   * ==========================================================
   * State
   * ==========================================================
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
   * ==========================================================
   * Fetch User Pending Documents
   * ==========================================================
   */

  const getPendingDocuments =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setApiError("");

          const response =
            await axios.get<UserPendingDocumentsResponse>(
              `${API_BASE_URL}/users/user-pending-documents`,
              {
                params: {
                  page,
                  limit,
                },

                withCredentials: true,
              },
            );

          console.log(
            "User pending documents response:",
            response.data,
          );

          setDocuments(
            response.data.data,
          );

          setMeta(
            response.data.meta,
          );
        }
        catch (error) {
          console.error(
            "Error fetching user pending documents:",
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
            }
            else {
              setApiError(
                message ||
                  "Could not fetch user pending documents.",
              );
            }
          }
          else {
            setApiError(
              "Something went wrong. Please try again.",
            );
          }
        }
        finally {
          setLoading(false);
        }
      },
      [page, limit],
    );

  /*
   * ==========================================================
   * Load Documents
   * ==========================================================
   */

  useEffect(() => {
    getPendingDocuments();
  }, [
    getPendingDocuments,
  ]);

  /*
   * ==========================================================
   * Format Date
   * ==========================================================
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
   * ==========================================================
   * Review User Document
   * ==========================================================
   */

  const handleReview = (
    userId: string,
  ) => {
    router.push(
      `/users/pending-documents/${userId}`,
    );
  };

  /*
   * ==========================================================
   * Pagination
   * ==========================================================
   */

  const goToPreviousPage =
    () => {
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

  /*
   * ==========================================================
   * Page Size
   * ==========================================================
   */

  const handleLimitChange = (
    value: number,
  ) => {
    setLimit(value);

    setPage(1);
  };

  /*
   * ==========================================================
   * Render
   * ==========================================================
   */

  return (
    <>
      {/* ==================================================
          Navbar
      ================================================== */}

      <RoleBasedNavbar />

      <Loading show={loading} />

      {/* ==================================================
          Error
      ================================================== */}

      <ErrorMessage
        message={apiError}
        show={!!apiError}
        onClose={() =>
          setApiError("")
        }
      />

      {/* ==================================================
          Main
      ================================================== */}

      <main className="min-h-screen bg-zinc-50 px-4 pt-20 pb-6 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          {/* ==================================================
              Header
          ================================================== */}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                User Pending Documents
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
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
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

          {/* ==================================================
              Summary Cards
          ================================================== */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Pending Documents */}

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">

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
                  <span className="text-lg">
                    !
                  </span>
                </div>

              </div>

            </div>

            {/* Current Page */}

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">

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

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">

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

          {/* ==================================================
              Verification Queue
          ================================================== */}

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

            {/* ==================================================
                Table Header
            ================================================== */}

            <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h2 className="font-semibold text-zinc-900">
                    User Verification Queue
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Users waiting for document
                    verification.
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
                    <option value={2}>
                      2
                    </option>

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

            {/* ==================================================
                Empty State
            ================================================== */}

            {!loading &&
              documents.length === 0 && (
                <div className="px-6 py-16 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                    <span className="text-xl text-emerald-600">
                      ✓
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                    No Pending User Documents
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                    There are currently no
                    user documents waiting
                    for verification.
                  </p>

                </div>
              )}

            {/* ==================================================
                Desktop Table
            ================================================== */}

            {!loading &&
              documents.length > 0 && (
                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full min-w-[950px]">

                    <thead className="border-b border-zinc-200 bg-zinc-50">

                      <tr>

                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          User
                        </th>

                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Email
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

                                  {user.userDocument.profileImage ? (
                                    <img
                                      src={`${API_BASE_URL}/uploads/profile/${encodeURIComponent(
                                        user.userDocument.profileImage,
                                      )}`}
                                      alt={`${user.firstName} ${user.lastName}`}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <>
                                      {user.firstName
                                        .charAt(0)
                                        .toUpperCase()}
                                    </>
                                  )}

                                </div>

                                <div className="min-w-0">

                                  <p className="truncate font-medium text-zinc-900">
                                    {user.firstName}{" "}
                                    {user.lastName}
                                  </p>

                                  <p className="truncate text-xs text-zinc-500">
                                    {user.userId}
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* Email */}

                            <td className="px-6 py-5">

                              <p className="max-w-[220px] truncate text-sm text-zinc-700">
                                {user.email}
                              </p>

                            </td>

                            {/* NID */}

                            <td className="px-6 py-5">

                              <p className="text-sm font-medium text-zinc-700">
                                {user.userDocument.nidNumber ||
                                  "Not provided"}
                              </p>

                            </td>

                            {/* Submitted */}

                            <td className="px-6 py-5">

                              <p className="text-sm text-zinc-700">
                                {formatDate(
                                  user.userDocument.createdAt,
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

                            {/* Review */}

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

            {/* ==================================================
                Mobile Cards
            ================================================== */}

            {!loading &&
              documents.length > 0 && (
                <div className="divide-y divide-zinc-200 md:hidden">

                  {documents.map(
                    (user) => (
                      <div
                        key={
                          user.userDocument.id
                        }
                        className="p-4"
                      >

                        {/* User */}

                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-semibold text-blue-600">

                            {user.userDocument.profileImage ? (
                              <img
                                src={`${API_BASE_URL}/uploads/profile/${encodeURIComponent(
                                  user.userDocument.profileImage,
                                )}`}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="h-11 w-11 rounded-full object-cover"
                              />
                            ) : (
                              <>
                                {user.firstName
                                  .charAt(0)
                                  .toUpperCase()}
                              </>
                            )}

                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-zinc-900">
                              {user.firstName}{" "}
                              {user.lastName}
                            </p>

                            <p className="truncate text-xs text-zinc-500">
                              {user.userId}
                            </p>

                          </div>

                        </div>

                        {/* Information */}

                        <div className="mt-4 grid grid-cols-1 gap-3">

                          <div>

                            <p className="text-xs font-medium text-zinc-500">
                              Email
                            </p>

                            <p className="mt-1 break-all text-sm text-zinc-800">
                              {user.email}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs font-medium text-zinc-500">
                              NID
                            </p>

                            <p className="mt-1 text-sm font-medium text-zinc-800">
                              {user.userDocument.nidNumber ||
                                "Not provided"}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs font-medium text-zinc-500">
                              Submitted
                            </p>

                            <p className="mt-1 text-sm text-zinc-800">
                              {formatDate(
                                user.userDocument.createdAt,
                              )}
                            </p>

                          </div>

                        </div>

                        {/* Bottom Action */}

                        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">

                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                            Pending

                          </span>

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

                        </div>

                      </div>
                    ),
                  )}

                </div>
              )}

            {/* ==================================================
                Pagination
            ================================================== */}

            {!loading &&
              meta &&
              meta.totalPages > 0 && (
                <div className="flex flex-col gap-4 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                  {/* Result Information */}

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

                  {/* Pagination Controls */}

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={
                        goToPreviousPage
                      }
                      disabled={
                        page === 1 ||
                        loading
                      }
                      className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">
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
                      className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
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