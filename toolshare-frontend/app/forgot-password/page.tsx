"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { forgotPassword, resetPassword } from "@/app/lib/rental-api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            if (!codeSent) {
                const result = await forgotPassword(email.trim());
                setCodeSent(true);
                setMessage(result.message || "A reset code has been sent to your email.");
            } else {
                const result = await resetPassword({
                    email: email.trim(),
                    verificationCode: verificationCode.trim(),
                    newPassword,
                });
                setMessage(result.message || "Your password has been reset. You can now log in.");
                setCodeSent(false);
                setVerificationCode("");
                setNewPassword("");
            }
        } catch (requestError: unknown) {
            const responseMessage = isAxiosError(requestError)
                ? requestError.response?.data?.message
                : undefined;
            setError(
                Array.isArray(responseMessage)
                    ? responseMessage.join(" ")
                    : responseMessage || "Unable to process your request. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_50%_0%,oklch(0.95_0.04_250),transparent_45%),var(--background)] px-4 py-12 sm:px-6">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-35px_rgba(15,35,70,0.28)] sm:p-8">
                <header className="text-center">
                    <Link href="/" className="text-sm font-bold tracking-tight text-slate-950">Tool<span className="text-primary">Share</span></Link>
                    <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">Reset your password</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        {codeSent
                            ? "Enter the code sent to your email and choose a new password."
                            : "Enter your account email and we’ll send you a reset code."}
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            readOnly={codeSent}
                            className="ts-input read-only:bg-slate-50"
                        />
                    </div>

                    {codeSent && (
                        <>
                            <div>
                                <label htmlFor="verificationCode" className="mb-2 block text-sm font-semibold text-slate-700">
                                    Reset code
                                </label>
                                <input
                                    id="verificationCode"
                                    type="text"
                                    required
                                    autoComplete="one-time-code"
                                    value={verificationCode}
                                    onChange={(event) => setVerificationCode(event.target.value)}
                                    className="ts-input"
                                />
                            </div>
                            <div>
                                <label htmlFor="newPassword" className="mb-2 block text-sm font-semibold text-slate-700">
                                    New password
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    className="ts-input"
                                />
                                <p className="mt-1 text-xs text-zinc-500">Use at least 6 characters.</p>
                            </div>
                        </>
                    )}

                    {message && <p role="status" className="text-sm text-green-700">{message}</p>}
                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="ts-button-primary w-full"
                    >
                        {loading
                            ? "Please wait…"
                            : codeSent
                              ? "Reset password"
                              : "Send reset code"}
                    </button>
                </form>

                {codeSent && (
                    <button
                        type="button"
                        onClick={() => {
                            setCodeSent(false);
                            setMessage("");
                            setError("");
                        }}
                        className="mt-4 w-full text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        Use a different email
                    </button>
                )}

                <p className="mt-6 text-center text-sm text-zinc-500">
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
                        Back to login
                    </Link>
                </p>
            </section>
        </main>
    );
}
