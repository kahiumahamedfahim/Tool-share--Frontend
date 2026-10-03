"use client";

import ModeratorNavbar from "../../components/moderator/ModeratorNavbar";

export default function ModeratorDashboardPage() {
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

      </div>

    </main>
  );
}