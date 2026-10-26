"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RiderNavbar from "@/app/components/rider/RiderNavbar";

import {
    getMyPaymentTasks,
    getMyRentalChargeTasks,
} from "@/app/lib/rental-api";
import { getMyHandoverTasks } from "@/app/lib/handover-api";

export default function DashboardPage() {
  const [openTasks, setOpenTasks] = useState<
    number | null
  >(null);
  const [chargeTasks, setChargeTasks] = useState<number | null>(null);
  const [handoverTasks, setHandoverTasks] = useState<number | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      const [payments, handovers, charges] = await Promise.allSettled([
        getMyPaymentTasks(),
        getMyHandoverTasks(),
        getMyRentalChargeTasks(),
      ]);

      if (payments.status === "fulfilled") setOpenTasks(payments.value?.length ?? 0);
      else console.error("Failed to load payment tasks:", payments.reason);

      if (handovers.status === "fulfilled") setHandoverTasks(handovers.value?.length ?? 0);
      else console.error("Failed to load handover tasks:", handovers.reason);

      if (charges.status === "fulfilled") setChargeTasks(charges.value?.length ?? 0);
      else console.error("Failed to load charge tasks:", charges.reason);
    };

    loadTasks();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50">
      <RiderNavbar />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Rider Dashboard
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Welcome to the ToolShare rider panel.
          </p>
        </div>

        <Link
          href="/rentals/handover-tasks"
          className="mt-6 block rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Custody Handover Tasks</h2>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              {handoverTasks === null ? "…" : handoverTasks}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Follow each rental&apos;s next pickup, delivery, or return step. Upload evidence and verify the responsible party&apos;s OTP.
          </p>
        </Link>

        <Link
          href="/rentals/payment-tasks"
          className="mt-4 block rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">
              Cash Payment Tasks
            </h2>

            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              {openTasks === null ? "…" : openTasks}
            </span>
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Collect rental payments in cash at
            handover and hand them over to the
            owners.
          </p>
        </Link>

        <Link
          href="/rentals/charge-tasks"
          className="mt-4 block rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Party Charge Collection</h2>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              {chargeTasks === null ? "…" : chargeTasks}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Collect separate rental and delivery charges from the named owner or renter. Moderators verify each record.
          </p>
        </Link>
      </div>
    </main>
  );
}
