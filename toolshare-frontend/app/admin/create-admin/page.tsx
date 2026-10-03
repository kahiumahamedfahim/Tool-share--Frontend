"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";

import {
  registrationSchema,
  type RegistrationFormData,
} from "@/schemas/auth/registration.schema";

import AdminNavbar from "@/app/components/admin/AdminNavbar";
import Loading from "@/app/components/Loading";
import ErrorMessage from "@/app/components/ErrorMessage";

export default function CreateAdminPage() {
  const router = useRouter();

  /*
   * --------------------------------------------------
   * Form States
   * --------------------------------------------------
   */

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [nidNumber, setNidNumber] = useState("");

  /*
   * --------------------------------------------------
   * File States
   * --------------------------------------------------
   */

  const [profileImage, setProfileImage] =
    useState<File | null>(null);

  const [nidFrontImage, setNidFrontImage] =
    useState<File | null>(null);

  const [nidBackImage, setNidBackImage] =
    useState<File | null>(null);

  /*
   * --------------------------------------------------
   * UI States
   * --------------------------------------------------
   */

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] = useState<
    Partial<Record<keyof RegistrationFormData, string>>
  >({});

  const [loading, setLoading] = useState(false);

  const [apiError, setApiError] = useState("");

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
     * --------------------------------------------------
     * Zod Validation
     * --------------------------------------------------
     */

    const result = registrationSchema.safeParse({
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      nidNumber,
    });

    if (!result.success) {
      const fieldErrors: Partial<
        Record<keyof RegistrationFormData, string>
      > = {};

      result.error.issues.forEach((issue) => {
        const field =
          issue.path[0] as keyof RegistrationFormData;

        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);

      return;
    }

    /*
     * --------------------------------------------------
     * Create FormData
     * --------------------------------------------------
     */

    const formData = new FormData();

    formData.append(
      "firstName",
      result.data.firstName,
    );

    formData.append(
      "lastName",
      result.data.lastName,
    );

    formData.append(
      "email",
      result.data.email,
    );

    formData.append(
      "phone",
      result.data.phone,
    );

    formData.append(
      "password",
      result.data.password,
    );

    formData.append(
      "nidNumber",
      result.data.nidNumber,
    );

    /*
     * --------------------------------------------------
     * Files
     * --------------------------------------------------
     */

    if (profileImage) {
      formData.append(
        "profileImage",
        profileImage,
      );
    }

    if (nidFrontImage) {
      formData.append(
        "nidFrontImage",
        nidFrontImage,
      );
    }

    if (nidBackImage) {
      formData.append(
        "nidBackImage",
        nidBackImage,
      );
    }

    /*
     * --------------------------------------------------
     * API Request
     * --------------------------------------------------
     */

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:7000/users/admin/register",
        formData,
        {
          withCredentials: true,
        },
      );

      console.log(
        "Admin created successfully:",
        response.data,
      );

      /*
       * ------------------------------------------------
       * Navigate to Email Verification
       * ------------------------------------------------
       */

      router.push(
        `/verify-email?email=${encodeURIComponent(email)}`,
      );

    } catch (error) {
      console.log(
        "Create admin error:",
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
              "Admin creation failed. Please try again.",
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

      <main className="min-h-screen bg-zinc-50">

        {/* Admin Navbar */}

        <AdminNavbar />

        <section className="px-6 py-10">

          <div className="mx-auto w-full max-w-2xl">

            {/* Header */}

            <div className="mb-8">

              <h1 className="text-3xl font-bold text-zinc-900">
                Create Admin
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Create a new administrator account
                for ToolShare.
              </p>

            </div>

            {/* Form Card */}

            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* First Name */}

                <div>

                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    First Name
                  </label>

                  <input
                    id="firstName"
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(event) => {
                      setFirstName(
                        event.target.value,
                      );

                      setErrors((previous) => ({
                        ...previous,
                        firstName: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                      errors.firstName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-300 focus:border-blue-600 focus:ring-blue-100"
                    }`}
                  />

                  {errors.firstName && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.firstName}
                    </p>
                  )}

                </div>

                {/* Last Name */}

                <div>

                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(event) => {
                      setLastName(
                        event.target.value,
                      );

                      setErrors((previous) => ({
                        ...previous,
                        lastName: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                      errors.lastName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-300 focus:border-blue-600 focus:ring-blue-100"
                    }`}
                  />

                  {errors.lastName && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.lastName}
                    </p>
                  )}

                </div>

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
                    placeholder="Enter email"
                    value={email}
                    onChange={(event) => {
                      setEmail(
                        event.target.value,
                      );

                      setErrors((previous) => ({
                        ...previous,
                        email: undefined,
                      }));
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

                {/* Phone */}

                <div>

                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(event) => {
                      setPhone(
                        event.target.value,
                      );

                      setErrors((previous) => ({
                        ...previous,
                        phone: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                      errors.phone
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-300 focus:border-blue-600 focus:ring-blue-100"
                    }`}
                  />

                  {errors.phone && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.phone}
                    </p>
                  )}

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
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter password"
                      value={password}
                      onChange={(event) => {
                        setPassword(
                          event.target.value,
                        );

                        setErrors((previous) => ({
                          ...previous,
                          password: undefined,
                        }));
                      }}
                      className={`w-full rounded-lg border px-4 py-3 pr-20 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                        errors.password
                          ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                          : "border-zinc-300 focus:border-blue-600 focus:ring-blue-100"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                  {errors.password && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.password}
                    </p>
                  )}

                </div>

                {/* Confirm Password */}

                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value,
                        );

                        setErrors((previous) => ({
                          ...previous,
                          confirmPassword:
                            undefined,
                        }));
                      }}
                      className={`w-full rounded-lg border px-4 py-3 pr-20 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                        errors.confirmPassword
                          ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                          : "border-zinc-300 focus:border-blue-600 focus:ring-blue-100"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}

                </div>

                {/* NID */}

                <div>

                  <label
                    htmlFor="nidNumber"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    NID Number
                  </label>

                  <input
                    id="nidNumber"
                    type="text"
                    placeholder="Enter 10 digit NID number"
                    value={nidNumber}
                    onChange={(event) => {
                      setNidNumber(
                        event.target.value,
                      );

                      setErrors((previous) => ({
                        ...previous,
                        nidNumber: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-sm text-zinc-900 outline-none transition focus:ring-2 ${
                      errors.nidNumber
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : "border-zinc-300 focus:border-blue-600 focus:ring-blue-100"
                    }`}
                  />

                  {errors.nidNumber && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.nidNumber}
                    </p>
                  )}

                </div>

                {/* Profile Image */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Profile Image
                  </label>

                  <label
                    htmlFor="profileImage"
                    className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-5 py-4 transition hover:border-blue-500 hover:bg-blue-50"
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      ↑
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium text-zinc-800 group-hover:text-blue-600">
                        {profileImage
                          ? profileImage.name
                          : "Upload profile image"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        JPG, PNG or WEBP · Max 2MB
                      </p>

                    </div>

                    <span className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-600">
                      Browse
                    </span>

                    <input
                      id="profileImage"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        setProfileImage(
                          event.target.files?.[0] ??
                            null,
                        )
                      }
                      className="hidden"
                    />

                  </label>

                </div>

                {/* NID Front */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    NID Front Image
                  </label>

                  <label
                    htmlFor="nidFrontImage"
                    className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-5 py-4 transition hover:border-blue-500 hover:bg-blue-50"
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      ↑
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium text-zinc-800 group-hover:text-blue-600">
                        {nidFrontImage
                          ? nidFrontImage.name
                          : "Upload NID front image"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        JPG, PNG or WEBP · Max 2MB
                      </p>

                    </div>

                    <span className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-600">
                      Browse
                    </span>

                    <input
                      id="nidFrontImage"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        setNidFrontImage(
                          event.target.files?.[0] ??
                            null,
                        )
                      }
                      className="hidden"
                    />

                  </label>

                </div>

                {/* NID Back */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    NID Back Image
                  </label>

                  <label
                    htmlFor="nidBackImage"
                    className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-5 py-4 transition hover:border-blue-500 hover:bg-blue-50"
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      ↑
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium text-zinc-800 group-hover:text-blue-600">
                        {nidBackImage
                          ? nidBackImage.name
                          : "Upload NID back image"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        JPG, PNG or WEBP · Max 2MB
                      </p>

                    </div>

                    <span className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-600">
                      Browse
                    </span>

                    <input
                      id="nidBackImage"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        setNidBackImage(
                          event.target.files?.[0] ??
                            null,
                        )
                      }
                      className="hidden"
                    />

                  </label>

                </div>

                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Creating Admin..."
                    : "Create Admin"}
                </button>

              </form>

            </div>

          </div>

        </section>

      </main>
    </>
  );
}