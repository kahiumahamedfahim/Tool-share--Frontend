"use client";

import AdminNavbar from "@/app/components/admin/AdminNavbar";

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-zinc-50">

      <AdminNavbar />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold text-zinc-900">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-zinc-500">
          Welcome to the ToolShare admin dashboard.
        </p>
      </section>

    </main>
  );
}