"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import axios, {
  isAxiosError,
} from "axios";

import {
  registrationSchema,
  RegistrationFormData,
} from "@/schemas/auth/registration.schema";

import Loading from "@/app/components/Loading";
import ErrorMessage from "@/app/components/ErrorMessage";
import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";

/*
 * ============================================================
 * Constants
 * ============================================================
 */

const API_BASE_URL =
  "http://localhost:7000";

const MAX_FILE_SIZE =
  2 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/*
 * ============================================================
 * Types
 * ============================================================
 */

type FormErrors = Partial<
  Record<
    keyof RegistrationFormData,
    string
  >
>;

/*
 * ============================================================
 * Component
 * ============================================================
 */

export default function CreateModeratorPage() {
  const router = useRouter();
  type UserRole = "ADMIN" | "MODERATOR";

  /*
   * ==========================================================
   * Form State
   * ==========================================================
   */

  const [formData, setFormData] =
    useState<RegistrationFormData>({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      nidNumber: "",
    });

  const [formErrors, setFormErrors] =
    useState<FormErrors>({});
    type UserRole = "ADMIN" | "MODERATOR";

  /*
   * ==========================================================
   * File State
   * ==========================================================
   */

  const [profileImage, setProfileImage] =
    useState<File | null>(null);

  const [nidFrontImage, setNidFrontImage] =
    useState<File | null>(null);

  const [nidBackImage, setNidBackImage] =
    useState<File | null>(null);

  /*
   * ==========================================================
   * Preview State
   * ==========================================================
   */

  const [profilePreview, setProfilePreview] =
    useState<string | null>(null);

  const [nidFrontPreview, setNidFrontPreview] =
    useState<string | null>(null);

  const [nidBackPreview, setNidBackPreview] =
    useState<string | null>(null);

  /*
   * ==========================================================
   * UI State
   * ==========================================================
   */

  const [loading, setLoading] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
    const [userRole, setUserRole] =
  useState<UserRole | null>(null);

  /*
   * ==========================================================
   * Input Change
   * ==========================================================
   */

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      }),
    );

    setFormErrors(
      (previous) => ({
        ...previous,
        [name]:
          undefined,
      }),
    );

    setApiError("");
  };

  /*
   * ==========================================================
   * File Validation
   * ==========================================================
   */

  const validateFile = (
    file: File,
  ): string | null => {
    if (
      !ALLOWED_FILE_TYPES.includes(
        file.type,
      )
    ) {
      return (
        "Only JPG, JPEG, PNG and WEBP " +
        "images are allowed."
      );
    }

    if (
      file.size > MAX_FILE_SIZE
    ) {
      return (
        "Image size must not exceed 2 MB."
      );
    }

    return null;
  };

  /*
   * ==========================================================
   * Profile Image
   * ==========================================================
   */

  const handleProfileImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const error =
      validateFile(file);

    if (error) {
      setApiError(error);
      event.target.value = "";
      return;
    }

    setProfileImage(file);

    setProfilePreview(
      URL.createObjectURL(file),
    );

    setApiError("");
  };

  /*
   * ==========================================================
   * NID Front Image
   * ==========================================================
   */

  const handleNidFrontImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const error =
      validateFile(file);

    if (error) {
      setApiError(error);
      event.target.value = "";
      return;
    }

    setNidFrontImage(file);

    setNidFrontPreview(
      URL.createObjectURL(file),
    );

    setApiError("");
  };

  /*
   * ==========================================================
   * NID Back Image
   * ==========================================================
   */

  const handleNidBackImageChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const error =
      validateFile(file);

    if (error) {
      setApiError(error);
      event.target.value = "";
      return;
    }

    setNidBackImage(file);

    setNidBackPreview(
      URL.createObjectURL(file),
    );

    setApiError("");
  };

  /*
   * ==========================================================
   * Remove Images
   * ==========================================================
   */

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfilePreview(null);
  };

  const removeNidFrontImage = () => {
    setNidFrontImage(null);
    setNidFrontPreview(null);
  };

  const removeNidBackImage = () => {
    setNidBackImage(null);
    setNidBackPreview(null);
  };

  /*
   * ==========================================================
   * Validate Form
   * ==========================================================
   */

  const validateForm = (): boolean => {
    const result =
      registrationSchema.safeParse(
        formData,
      );

    if (result.success) {
      setFormErrors({});
      return true;
    }

    const errors: FormErrors = {};

    result.error.issues.forEach(
      (issue) => {
        const field =
          issue.path[0] as keyof RegistrationFormData;

        if (!errors[field]) {
          errors[field] =
            issue.message;
        }
      },
    );

    setFormErrors(errors);

    return false;
  };

  /*
   * ==========================================================
   * Submit
   * ==========================================================
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setApiError("");
    setSuccessMessage("");

    /*
     * --------------------------------------------------------
     * Zod Validation
     * --------------------------------------------------------
     */

    const isValid =
      validateForm();

    if (!isValid) {
      return;
    }

    /*
     * --------------------------------------------------------
     * Required File Validation
     * --------------------------------------------------------
     */

    if (!profileImage) {
      setApiError(
        "Profile image is required.",
      );
      return;
    }

    if (!nidFrontImage) {
      setApiError(
        "NID front image is required.",
      );
      return;
    }

    if (!nidBackImage) {
      setApiError(
        "NID back image is required.",
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * ------------------------------------------------------
       * Create FormData
       * ------------------------------------------------------
       */

      const multipartData =
        new FormData();

      /*
       * ------------------------------------------------------
       * Text Fields
       * ------------------------------------------------------
       */

      multipartData.append(
        "firstName",
        formData.firstName.trim(),
      );

      multipartData.append(
        "lastName",
        formData.lastName.trim(),
      );

      multipartData.append(
        "email",
        formData.email.trim(),
      );

      multipartData.append(
        "phone",
        formData.phone.trim(),
      );

      multipartData.append(
        "password",
        formData.password,
      );

      multipartData.append(
        "nidNumber",
        formData.nidNumber.trim(),
      );

      /*
       * ------------------------------------------------------
       * Files
       * ------------------------------------------------------
       */

      multipartData.append(
        "profileImage",
        profileImage,
      );

      multipartData.append(
        "nidFrontImage",
        nidFrontImage,
      );

      multipartData.append(
        "nidBackImage",
        nidBackImage,
      );

      /*
       * IMPORTANT:
       *
       * confirmPassword is NOT sent.
       *
       * It is only used by Zod for frontend
       * password confirmation.
       */

      /*
       * ------------------------------------------------------
       * API Request
       * ------------------------------------------------------
       */

      const response =
  await axios.post(
    `${API_BASE_URL}/users/moderator/register`,
    multipartData,
    {
      withCredentials: true,
    },
  );

console.log(
  "Create moderator response:",
  response.data,
);

router.push(
  `/verify-email?email=${encodeURIComponent(
    formData.email.trim(),
  )}`,
);

    } 
    catch (error) {
      console.error(
        "Create moderator error:",
        error,
      );

      if (
        isAxiosError(error)
      ) {
        const message =
          error.response?.data
            ?.message;

        if (
          Array.isArray(message)
        ) {
          setApiError(
            message.join(", "),
          );
        } else {
          setApiError(
            message ||
              "Failed to create moderator.",
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

  /*
   * ==========================================================
   * Render
   * ==========================================================
   */

  return (
    <>
      {/* ================================================== */}
      {/* Loading */}
      {/* ================================================== */}

 <RoleBasedNavbar role={userRole ?? "ADMIN"} />
      <Loading show={loading} />

      {/* ================================================== */}
      {/* API Error */}
      {/* ================================================== */}

      <ErrorMessage
        message={apiError}
        show={!!apiError}
        onClose={() =>
          setApiError("")
        }
      />

      {/* ================================================== */}
      {/* Main */}
      {/* ================================================== */}

      <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

          {/* ================================================== */}
          {/* Header */}
          {/* ================================================== */}

          <div className="mb-8">

            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              ← Back
            </button>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                Create Moderator
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Create a new moderator account
                and submit the required identity
                documents.
              </p>
            </div>

          </div>

          {/* ================================================== */}
          {/* Success Message */}
          {/* ================================================== */}

          {successMessage && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">

              <div className="flex items-start gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  ✓
                </div>

                <div>
                  <p className="font-semibold text-emerald-800">
                    Success
                  </p>

                  <p className="mt-1 text-sm text-emerald-700">
                    {successMessage}
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* ================================================== */}
          {/* Form */}
          {/* ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* ================================================== */}
            {/* Account Information */}
            {/* ================================================== */}

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="mb-7">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    👤
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">
                      Account Information
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Enter the moderator's basic
                      account information.
                    </p>
                  </div>

                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* ================================================== */}
                {/* First Name */}
                {/* ================================================== */}

                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    First Name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={
                      formData.firstName
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Enter first name"
                    disabled={loading}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-100 ${
                      formErrors.firstName
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-zinc-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  {formErrors.firstName && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {
                        formErrors.firstName
                      }
                    </p>
                  )}
                </div>

                {/* ================================================== */}
                {/* Last Name */}
                {/* ================================================== */}

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={
                      formData.lastName
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Enter last name"
                    disabled={loading}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-100 ${
                      formErrors.lastName
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-zinc-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  {formErrors.lastName && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {
                        formErrors.lastName
                      }
                    </p>
                  )}
                </div>

                {/* ================================================== */}
                {/* Email */}
                {/* ================================================== */}

                <div>
               <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Email
                  </label>

                 <input
  id="email"
  name="email"
  type="email"
  value={formData.email}
  onChange={handleInputChange}
  placeholder="Enter email"
  disabled={loading}
  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-100 ${
    formErrors.email
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-zinc-300 focus:border-blue-500 focus:ring-blue-100"
  }`}
/>

                  {formErrors.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {
                        formErrors.email
                      }
                    </p>
                  )}
                </div>

                {/* ================================================== */}
                {/* Phone */}
                {/* ================================================== */}

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="01712345678"
                    disabled={loading}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-100 ${
                      formErrors.phone
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-zinc-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  {formErrors.phone && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {
                        formErrors.phone
                      }
                    </p>
                  )}

                  <p className="mt-1.5 text-xs text-zinc-400">
                    Example: 01712345678
                  </p>
                </div>

                {/* ================================================== */}
                {/* Password */}
                {/* ================================================== */}

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        formData.password
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="Enter password"
                      disabled={loading}
                      className={`w-full rounded-xl border bg-white px-4 py-3 pr-20 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-100 ${
                        formErrors.password
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-zinc-300 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous,
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 transition hover:text-zinc-900"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                  {formErrors.password && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {
                        formErrors.password
                      }
                    </p>
                  )}
                </div>

                {/* ================================================== */}
                {/* Confirm Password */}
                {/* ================================================== */}

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        formData.confirmPassword
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="Confirm password"
                      disabled={loading}
                      className={`w-full rounded-xl border bg-white px-4 py-3 pr-20 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-100 ${
                        formErrors.confirmPassword
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-zinc-300 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (previous) =>
                            !previous,
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 transition hover:text-zinc-900"
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                  {formErrors.confirmPassword && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {
                        formErrors.confirmPassword
                      }
                    </p>
                  )}
                </div>

                {/* ================================================== */}
                {/* NID Number */}
                {/* ================================================== */}

                <div className="sm:col-span-2">

                  <label
                    htmlFor="nidNumber"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    NID Number
                  </label>

                  <input
                    id="nidNumber"
                    name="nidNumber"
                    type="text"
                    value={
                      formData.nidNumber
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Enter 10 digit NID number"
                    disabled={loading}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-100 ${
                      formErrors.nidNumber
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-zinc-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  {formErrors.nidNumber && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {
                        formErrors.nidNumber
                      }
                    </p>
                  )}

                </div>

              </div>

            </section>

            {/* ================================================== */}
            {/* Identity Documents */}
            {/* ================================================== */}

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="mb-7">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    🪪
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">
                      Identity Documents
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      All three documents are required
                      to create the moderator.
                    </p>
                  </div>

                </div>

              </div>

              <div className="grid gap-6 lg:grid-cols-3">

                {/* ================================================== */}
                {/* Profile Image */}
                {/* ================================================== */}

                <div>

                  <p className="mb-2 text-sm font-semibold text-zinc-700">
                    Profile Image
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </p>

                  <label
                    htmlFor="profileImage"
                    className="block cursor-pointer"
                  >

                    <div className="flex min-h-72 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 transition hover:border-blue-400 hover:bg-blue-50/30">

                      {profilePreview ? (
                        <img
                          src={
                            profilePreview
                          }
                          alt="Profile preview"
                          className="h-72 w-full object-cover"
                        />
                      ) : (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                            👤
                          </div>

                          <p className="mt-4 text-sm font-semibold text-zinc-700">
                            Upload Profile Image
                          </p>

                          <p className="mt-1 text-xs text-zinc-400">
                            JPG, PNG, WEBP · Max 2MB
                          </p>
                        </>
                      )}

                    </div>

                    <input
                      id="profileImage"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleProfileImageChange
                      }
                      disabled={loading}
                      className="hidden"
                    />

                  </label>

                  {profileImage && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">

                      <p className="min-w-0 truncate text-xs text-zinc-500">
                        {
                          profileImage.name
                        }
                      </p>

                      <button
                        type="button"
                        onClick={
                          removeProfileImage
                        }
                        disabled={loading}
                        className="ml-3 shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>

                    </div>
                  )}

                </div>

                {/* ================================================== */}
                {/* NID Front */}
                {/* ================================================== */}

                <div>

                  <p className="mb-2 text-sm font-semibold text-zinc-700">
                    NID Front
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </p>

                  <label
                    htmlFor="nidFrontImage"
                    className="block cursor-pointer"
                  >

                    <div className="flex min-h-72 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 transition hover:border-blue-400 hover:bg-blue-50/30">

                      {nidFrontPreview ? (
                        <img
                          src={
                            nidFrontPreview
                          }
                          alt="NID front preview"
                          className="h-72 w-full object-contain"
                        />
                      ) : (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                            🪪
                          </div>

                          <p className="mt-4 text-sm font-semibold text-zinc-700">
                            Upload NID Front
                          </p>

                          <p className="mt-1 text-xs text-zinc-400">
                            JPG, PNG, WEBP · Max 2MB
                          </p>
                        </>
                      )}

                    </div>

                    <input
                      id="nidFrontImage"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleNidFrontImageChange
                      }
                      disabled={loading}
                      className="hidden"
                    />

                  </label>

                  {nidFrontImage && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">

                      <p className="min-w-0 truncate text-xs text-zinc-500">
                        {
                          nidFrontImage.name
                        }
                      </p>

                      <button
                        type="button"
                        onClick={
                          removeNidFrontImage
                        }
                        disabled={loading}
                        className="ml-3 shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>

                    </div>
                  )}

                </div>

                {/* ================================================== */}
                {/* NID Back */}
                {/* ================================================== */}

                <div>

                  <p className="mb-2 text-sm font-semibold text-zinc-700">
                    NID Back
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </p>

                  <label
                    htmlFor="nidBackImage"
                    className="block cursor-pointer"
                  >

                    <div className="flex min-h-72 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 transition hover:border-blue-400 hover:bg-blue-50/30">

                      {nidBackPreview ? (
                        <img
                          src={
                            nidBackPreview
                          }
                          alt="NID back preview"
                          className="h-72 w-full object-contain"
                        />
                      ) : (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                            🪪
                          </div>

                          <p className="mt-4 text-sm font-semibold text-zinc-700">
                            Upload NID Back
                          </p>

                          <p className="mt-1 text-xs text-zinc-400">
                            JPG, PNG, WEBP · Max 2MB
                          </p>
                        </>
                      )}

                    </div>

                    <input
                      id="nidBackImage"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleNidBackImageChange
                      }
                      disabled={loading}
                      className="hidden"
                    />

                  </label>

                  {nidBackImage && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">

                      <p className="min-w-0 truncate text-xs text-zinc-500">
                        {
                          nidBackImage.name
                        }
                      </p>

                      <button
                        type="button"
                        onClick={
                          removeNidBackImage
                        }
                        disabled={loading}
                        className="ml-3 shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>

                    </div>
                  )}

                </div>

              </div>

              {/* ================================================== */}
              {/* Upload Information */}
              {/* ================================================== */}

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

                <p className="text-xs leading-5 text-blue-700">
                  All three images are required.
                  Supported formats are JPG, JPEG,
                  PNG and WEBP. Maximum file size is
                  2 MB per image.
                </p>

              </div>

            </section>

            {/* ================================================== */}
            {/* Submit Section */}
            {/* ================================================== */}

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="font-semibold text-zinc-900">
                    Create Moderator
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Review all information before
                    creating the moderator account.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">

                  <button
                    type="button"
                    onClick={() =>
                      router.back()
                    }
                    disabled={loading}
                    className="rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Creating Moderator..."
                      : "Create Moderator"}
                  </button>

                </div>

              </div>

            </section>

          </form>

        </div>
      </main>
    </>
  );
}