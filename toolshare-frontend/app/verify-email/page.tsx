"use client";

import {
  Suspense,
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import axios, { isAxiosError } from "axios";

import {
  verifyEmailSchema,
} from "@/schemas/auth/verify-email.schema";

import Loading from "@/app/components/Loading";
import ErrorMessage from "@/app/components/ErrorMessage";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-600">
            Loading verification...
          </p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  /*
   * --------------------------------------------------
   * OTP State
   * --------------------------------------------------
   */

  const [verificationCode, setVerificationCode] =
    useState("");

  /*
   * --------------------------------------------------
   * Countdown State
   * --------------------------------------------------
   */

  const [timeLeft, setTimeLeft] =
    useState(2 * 60);

  /*
   * --------------------------------------------------
   * UI States
   * --------------------------------------------------
   */

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * --------------------------------------------------
   * Countdown
   * --------------------------------------------------
   */

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(
        (previous) => previous - 1,
      );
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [timeLeft]);

  /*
   * --------------------------------------------------
   * Convert Seconds
   * --------------------------------------------------
   */

  const minutes = Math.floor(
    timeLeft / 60,
  );

  const seconds = timeLeft % 60;

  /*
   * --------------------------------------------------
   * Verify Email
   * --------------------------------------------------
   */

  const handleVerifyEmail = async () => {
    setError("");

    const result =
      verifyEmailSchema.safeParse({
        email,
        verificationCode,
      });

    /*
     * Zod Validation
     */

    if (!result.success) {
      setError(
        result.error.issues[0].message,
      );

      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:7000/users/verify-email",
        {
          email: result.data.email,
          verificationCode:
            result.data.verificationCode,
        },
        {
          withCredentials: true,
        },
      );

      console.log(
        "Email verified:",
        response.data,
      );

      /*
       * Redirect to Login
       */
        const role = response.data.role;

if (role === "ADMIN") {
  router.push(
    "/admin/pending-documents",
  );
} else if (role === "MODERATOR") {
  router.push(
    "/moderator/pending-documents",
  );
} else if (role === "RIDER") {
  router.push(
    "/rider/pending-documents",
  );
} else {
  router.push("/thank-you");
}


    } 
    catch (error) {
      console.log(
        "Email verification error:",
        error,
      );

      if (isAxiosError(error)) {
        const message =
          error.response?.data?.message;

        if (Array.isArray(message)) {
          setError(
            message.join(", "),
          );
        } else {
          setError(
            message ||
              "Email verification failed. Please try again.",
          );
        }
      } else {
        setError(
          "Something went wrong. Please try again.",
        );
      }

    } finally {
      setLoading(false);
    }
  };

  /*
   * --------------------------------------------------
   * Resend Verification Code
   * --------------------------------------------------
   */

  const handleResendCode = async () => {

    if (
      timeLeft > 0 ||
      resending
    ) {
      return;
    }

    setError("");

    try {
      setResending(true);

      const response = await axios.post(
        "http://localhost:7000/users/resend-verification-code",
        {
          email,
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
       * Reset countdown
       */

      setTimeLeft(
        2* 60,
      );

      /*
       * Clear previous OTP
       */

      setVerificationCode("");

    } catch (error) {
      console.log(
        "Resend verification error:",
        error,
      );

      if (isAxiosError(error)) {
        const message =
          error.response?.data?.message;

        if (Array.isArray(message)) {
          setError(
            message.join(", "),
          );
        } else {
          setError(
            message ||
              "Could not resend verification code.",
          );
        }
      } else {
        setError(
          "Something went wrong. Please try again.",
        );
      }

    } finally {
      setResending(false);
    }
  };

  return (
    <>
      {/* ------------------------------------------------
          Loading
      ------------------------------------------------ */}

      <Loading
        show={
          loading ||
          resending
        }
      />

      {/* ------------------------------------------------
          Error
      ------------------------------------------------ */}

      <ErrorMessage
        message={error}
        show={!!error}
        onClose={() =>
          setError("")
        }
      />

      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">

        <div className="w-full max-w-md">

          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">

            {/* ------------------------------------------------
                Header
            ------------------------------------------------ */}

            <div className="text-center">

              <h1 className="text-2xl font-bold text-zinc-900">
                Verify Your Email
              </h1>

              <p className="mt-3 text-sm text-zinc-500">
                We sent a verification code to
              </p>

              <p className="mt-1 break-all font-medium text-blue-600">
                {email}
              </p>

            </div>

            {/* ------------------------------------------------
                OTP
            ------------------------------------------------ */}

            <div className="mt-8">

              <label className="mb-3 block text-center text-sm font-medium text-zinc-700">
                Enter verification code
              </label>

              <div className="relative flex justify-center gap-2">

                {/* OTP Boxes */}

                {Array.from({
                  length: 6,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className={`flex h-12 w-11 items-center justify-center rounded-lg border text-lg font-semibold transition ${
                        verificationCode[
                          index
                        ]
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-zinc-300 bg-white text-zinc-400"
                      }`}
                    >
                      {
                        verificationCode[
                          index
                        ] || ""
                      }
                    </div>
                  ),
                )}

                {/* Invisible Input */}

                <input
                  type="text"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  value={verificationCode}
                  onChange={(
                    event,
                  ) => {
                    const value =
                      event.target.value.replace(
                        /\D/g,
                        "",
                      );

                    setVerificationCode(
                      value,
                    );
                  }}
                  className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                />

              </div>

            </div>

            {/* ------------------------------------------------
                Countdown
            ------------------------------------------------ */}

            <div className="mt-8 flex justify-center">

              <div className="flex items-center gap-3">

                {/* Minutes */}

                <div className="flex min-w-20 flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-sm">

                  <span
                    className={`countdown font-mono text-4xl font-bold ${
                      timeLeft === 0
                        ? "text-red-600"
                        : "text-zinc-900"
                    }`}
                  >

                    <span
                      style={
                        {
                          "--value":
                            minutes,
                        } as CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${minutes} minutes`}
                    >
                      {minutes}
                    </span>

                  </span>

                  <span className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Min
                  </span>

                </div>

                {/* Separator */}

                <span className="mb-5 text-2xl font-bold text-zinc-400">
                  :
                </span>

                {/* Seconds */}

                <div className="flex min-w-20 flex-col items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-sm">

                  <span
                    className={`countdown font-mono text-4xl font-bold ${
                      timeLeft === 0
                        ? "text-red-600"
                        : "text-zinc-900"
                    }`}
                  >

                    <span
                      style={
                        {
                          "--value":
                            seconds,
                        } as CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${seconds} seconds`}
                    >
                      {seconds}
                    </span>

                  </span>

                  <span className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Sec
                  </span>

                </div>

              </div>

            </div>

            {/* ------------------------------------------------
                Verify Button
            ------------------------------------------------ */}

            <button
              type="button"
              onClick={
                handleVerifyEmail
              }
              disabled={
                loading ||
                verificationCode.length !==
                  6
              }
              className="mt-8 w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Verifying..."
                : "Verify Email"}
            </button>

            {/* ------------------------------------------------
                Resend
            ------------------------------------------------ */}

            <div className="mt-5 text-center">

              <p className="text-sm text-zinc-500">
                Didn&apos;t receive the code?
              </p>

              <button
                type="button"
                onClick={
                  handleResendCode
                }
                disabled={
                  timeLeft > 0 ||
                  resending
                }
                className={`mt-2 text-sm font-medium transition ${
                  timeLeft === 0 &&
                  !resending
                    ? "text-blue-600 hover:text-blue-700"
                    : "cursor-not-allowed text-zinc-400"
                }`}
              >

                {resending
                  ? "Sending..."
                  : timeLeft > 0
                    ? `Resend code in ${minutes}:${seconds
                        .toString()
                        .padStart(
                          2,
                          "0",
                        )}`
                    : "Resend verification code"}

              </button>

            </div>

          </div>

        </div>

      </main>
    </>
  );
}