"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await axios.post(
          "http://localhost:7000/auth/logout",
          {},
          {
            withCredentials: true,
          },
        );
      } catch (error) {
        console.error(
          "Logout failed:",
          error,
        );
      } finally {
        router.replace("/login");
      }
    };

    logout();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          <span className="loading loading-spinner loading-md text-blue-600" />
        </div>

        <h1 className="mt-5 text-xl font-semibold text-zinc-900">
          Logging out...
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Please wait while we securely log you out.
        </p>

      </div>
    </main>
  );
}