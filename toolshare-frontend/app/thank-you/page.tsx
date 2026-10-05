
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ThankYouPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">

      <div className="w-full max-w-md">

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">

          {/* Success Icon */}

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xl font-bold text-white">
              ✓
            </div>

          </div>

          {/* Heading */}

          <h1 className="mt-6 text-2xl font-bold text-zinc-900">
            Email Verified Successfully!
          </h1>

          {/* Message */}

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Your email address has been successfully
            verified. Welcome to ToolShare!
          </p>

          {/* Redirect Message */}

          <p className="mt-6 text-sm text-zinc-400">
            Redirecting you to the home page...
          </p>

          {/* Loading Indicator */}

          <div className="mt-5 flex justify-center">

            <span className="loading loading-dots loading-md text-blue-600" />

          </div>

        </div>

      </div>

    </main>
  );
}
