"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Loading from "@/app/components/Loading";
import ErrorMessage from "@/app/components/ErrorMessage";

import {loginSchema,type LoginFormData,} from "@/schemas/auth/login.schema";

export default function LoginPage() {
 const router= useRouter();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);

const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const handleSubmit = async (
  event: FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  setError("");

  const result = loginSchema.safeParse({
    email,
    password,
  });

  if (!result.success) 
    {
    setError(result.error.issues[0].message);
    return;
  }
try {
  setLoading(true);

  const response = await axios.post(
    "http://localhost:7000/auth/login",
    {
      email: result.data.email,
      password: result.data.password,
    },
    {
      withCredentials: true,
    },
  );

  console.log("Login response:", response.data);
  localStorage.setItem("userRole", response.data.role);

  if (response.data.role === "ADMIN") {
    router.push("/admin/dashboard");
  } else if (response.data.role === "MODERATOR") {
    router.push("/moderator/dashboard");
  } else if (response.data.role === "RIDER") {
    router.push("/rider/dashboard");
  } else if (response.data.role === "USER") {
    router.push("/dashboard");
  }
}
catch (error: any) {
  console.log("Login error:", error);

  setError(
    error.response?.data?.message ||
    "Login failed. Please try again."
  );
}
finally
{
    setLoading(false);
}
  
};

return (
  <main className="relative flex h-screen items-center justify-center bg-zinc-50 px-6">
    <Loading show={loading} />
     <ErrorMessage
    show={!!error}
    message={error}
    onClose={() => setError("")}
  />

    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-zinc-900">
          Welcome to Tool<span className="text-blue-600">Share</span>
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Sign in to your account
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
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
             className="w-full rounded-lg border border-zinc-300 px-4 py-3 pr-20 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
/>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}

        {/* Login button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Register */}
      <p className="mt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <a
          href="/register/admin"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Create Admin Account
        </a>
      </p>
    </div>
  </main>
);
}