"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import ModeratorNavbar from "../../components/moderator/ModeratorNavbar";
import { getModeratorRentalRequests } from "../../lib/rental-api";

export default function ModeratorDashboardPage() {
  const [pendingReviews, setPendingReviews] =
    useState<number | null>(null);

  useEffect(() => {
    const loadQueueCount = async () => {
      try {
        const data = await getModeratorRentalRequests(
          1,
          1,
        );

        setPendingReviews(data.meta?.total ?? 0);
      } catch (err) {
        console.error(
          "Failed to load rental review queue count:",
          err,
        );
      }
    };

    loadQueueCount();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50">

      {/* Moderator Navbar */}
      <ModeratorNavbar />

      {/* Dashboard Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Moderator Dashboard
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Welcome to the ToolShare moderator panel.
          </p>

        </div>

        {/* Quick Actions */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <Link
            href="/rentals/moderator"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <h2 className="text-base font-semibold text-zinc-900">
                Rental Review Queue
              </h2>

              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                {pendingReviews === null ? "…" : pendingReviews}
              </span>

            </div>

            <p className="mt-2 text-sm text-zinc-500">
              Review price-agreed rental requests and
              confirm or reject bookings.
            </p>

          </Link>

          <Link
            href="/moderator/pending-documents"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >

            <h2 className="text-base font-semibold text-zinc-900">
              Pending Documents
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Verify identity documents submitted by
              users.
            </p>

          </Link>

          <Link
            href="/moderator/categories"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >

            <h2 className="text-base font-semibold text-zinc-900">
              Categories
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Manage product categories and their
              images.
            </p>

          </Link>

        </div>

      </div>

    </main>
  );
}