"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import axios, { isAxiosError } from "axios";

import {
  resendVerificationSchema,
  type ResendVerificationFormData,
} from "@/schemas/auth/resend-verification.schema";

import Loading from "@/app/components/Loading";
import ErrorMessage from "@/app/components/ErrorMessage";

export default function ResendVerificationPage() {
  const router = useRouter();

  /*
   * --------------------------------------------------
   * Form State
   * --------------------------------------------------
   */

  const [email, setEmail] = useState("");

  /*
   * --------------------------------------------------
   * Validation State
   * --------------------------------------------------
   */

  const [errors, setErrors] = useState<
    Partial<
      Record<
        keyof ResendVerificationFormData,
        string
      >
    >
  >({});

  /*
   * --------------------------------------------------
   * UI State
   * --------------------------------------------------
   */

  const [loading, setLoading] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  /*
   * --------------------------------------------------
   * Submit
   * --------------------------------------------------
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrors({});
    setApiError("");

    /*
     * Zod Validation
     */

    const result =
      resendVerificationSchema.safeParse({
        email,
      });

    if (!result.success) {
      const fieldErrors: Partial<
        Record<
          keyof ResendVerificationFormData,
          string
        >
      > = {};

      result.error.issues.forEach(
        (issue) => {
          const field =
            issue.path[0] as keyof ResendVerificationFormData;

          if (!fieldErrors[field]) {
            fieldErrors[field] =
              issue.message;
          }
        },
      );

      setErrors(fieldErrors);

      return;
    }

    /*
     * API Request
     */

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:7000/users/resend-verification-code",
        {
          email: result.data.email,
        },
        {
          withCredentials: true,
        },
      );

      console.log(
        "Verification code resent:",
        response.data,
      );

      /*
       * Go back to verification page
       *
       * The new code is valid for
       * another 10 minutes.
       */

      router.push(
        `/verify-email?email=${encodeURIComponent(
          result.data.email,
        )}`,
      );

    } catch (error) {
      console.log(
        "Resend verification error:",
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
              "Could not resend verification code. Please try again.",
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

  return (
    <>
      {/* Loading */}

      <Loading show={loading} />

      {/* Error */}

      <ErrorMessage
        message={apiError}
        show={!!apiError}
        onClose={() => setApiError("")}
      />

      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">

        <div className="w-full max-w-md">

          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">

            {/* Header */}

            <div className="text-center">

              <h1 className="text-2xl font-bold text-zinc-900">
                Resend Verification Code
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Enter your registered email address
                and we will send you a new
                verification code.
              </p>

            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => {
                    setEmail(
                      event.target.value,
                    );

                    setErrors(
                      (previous) => ({
                        ...previous,
                        email:
                          undefined,
                      }),
                    );
                  }}
                  className={`w-full rounded-lg border px-4 py-3 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                    errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                      : "border-zinc-300 focus:border-blue-600 focus:ring-blue-100"
                  }`}
                />

                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-500">
                    {errors.email}
                  </p>
                )}

              </div>

              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Sending..."
                  : "Send Verification Code"}
              </button>

            </form>

            {/* Back */}

            <div className="mt-5 text-center">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/verify-email?email=${encodeURIComponent(
                      email,
                    )}`,
                  )
                }
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                Back to verification
              </button>

            </div>

          </div>

        </div>

      </main>
    </>
  );
}