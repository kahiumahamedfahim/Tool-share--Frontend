 "use client";

import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import Loading from "@/app/components/Loading";
import ErrorMessage from "@/app/components/ErrorMessage";

import {
  riderSchema,
  type RiderFormData,
} from "@/schemas/auth/rider.schema";

const API_BASE_URL = "http://localhost:7000";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

type FormErrors = Partial<Record<keyof RiderFormData, string>>;

type FileField =
  | "profileImage"
  | "nidFrontImage"
  | "nidBackImage"
  | "drivingLicenseFrontImage"
  | "drivingLicenseBackImage"
  | "vehicleImage";

export default function CreateRiderPage() {
  const router = useRouter();

  /* ============================================================
     Form State
     ============================================================ */

  const [formData, setFormData] = useState<RiderFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    nidNumber: "",
    drivingLicenseNumber: "",
    vehicleType: "",
    vehicleNumber: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  /* ============================================================
     File State
     ============================================================ */

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [nidFrontImage, setNidFrontImage] = useState<File | null>(null);
  const [nidBackImage, setNidBackImage] = useState<File | null>(null);
  const [drivingLicenseFrontImage, setDrivingLicenseFrontImage] =
    useState<File | null>(null);
  const [drivingLicenseBackImage, setDrivingLicenseBackImage] =
    useState<File | null>(null);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);

  /* ============================================================
     Preview State
     ============================================================ */

  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [nidFrontPreview, setNidFrontPreview] = useState<string | null>(null);
  const [nidBackPreview, setNidBackPreview] = useState<string | null>(null);
  const [drivingLicenseFrontPreview, setDrivingLicenseFrontPreview] =
    useState<string | null>(null);
  const [drivingLicenseBackPreview, setDrivingLicenseBackPreview] =
    useState<string | null>(null);
  const [vehiclePreview, setVehiclePreview] = useState<string | null>(null);

  /* ============================================================
     UI State
     ============================================================ */

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ============================================================
     Input Change
     ============================================================ */

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));

    setApiError("");
  };

  /* ============================================================
     File Validation
     ============================================================ */

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Only JPG, JPEG, PNG and WEBP images are allowed.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Image size must not exceed 2 MB.";
    }

    return null;
  };

  /* ============================================================
     File Change
     ============================================================ */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    field: FileField,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setApiError(validationError);
      event.target.value = "";
      return;
    }

    const preview = URL.createObjectURL(file);

    switch (field) {
      case "profileImage":
        if (profilePreview) URL.revokeObjectURL(profilePreview);
        setProfileImage(file);
        setProfilePreview(preview);
        break;

      case "nidFrontImage":
        if (nidFrontPreview) URL.revokeObjectURL(nidFrontPreview);
        setNidFrontImage(file);
        setNidFrontPreview(preview);
        break;

      case "nidBackImage":
        if (nidBackPreview) URL.revokeObjectURL(nidBackPreview);
        setNidBackImage(file);
        setNidBackPreview(preview);
        break;

      case "drivingLicenseFrontImage":
        if (drivingLicenseFrontPreview) {
          URL.revokeObjectURL(drivingLicenseFrontPreview);
        }
        setDrivingLicenseFrontImage(file);
        setDrivingLicenseFrontPreview(preview);
        break;

      case "drivingLicenseBackImage":
        if (drivingLicenseBackPreview) {
          URL.revokeObjectURL(drivingLicenseBackPreview);
        }
        setDrivingLicenseBackImage(file);
        setDrivingLicenseBackPreview(preview);
        break;

      case "vehicleImage":
        if (vehiclePreview) URL.revokeObjectURL(vehiclePreview);
        setVehicleImage(file);
        setVehiclePreview(preview);
        break;
    }

    setApiError("");
  };

  /* ============================================================
     Remove File
     ============================================================ */

  const removeFile = (field: FileField) => {
    switch (field) {
      case "profileImage":
        if (profilePreview) URL.revokeObjectURL(profilePreview);
        setProfileImage(null);
        setProfilePreview(null);
        break;

      case "nidFrontImage":
        if (nidFrontPreview) URL.revokeObjectURL(nidFrontPreview);
        setNidFrontImage(null);
        setNidFrontPreview(null);
        break;

      case "nidBackImage":
        if (nidBackPreview) URL.revokeObjectURL(nidBackPreview);
        setNidBackImage(null);
        setNidBackPreview(null);
        break;

      case "drivingLicenseFrontImage":
        if (drivingLicenseFrontPreview) {
          URL.revokeObjectURL(drivingLicenseFrontPreview);
        }
        setDrivingLicenseFrontImage(null);
        setDrivingLicenseFrontPreview(null);
        break;

      case "drivingLicenseBackImage":
        if (drivingLicenseBackPreview) {
          URL.revokeObjectURL(drivingLicenseBackPreview);
        }
        setDrivingLicenseBackImage(null);
        setDrivingLicenseBackPreview(null);
        break;

      case "vehicleImage":
        if (vehiclePreview) URL.revokeObjectURL(vehiclePreview);
        setVehicleImage(null);
        setVehiclePreview(null);
        break;
    }
  };

  /* ============================================================
     Validate Form
     ============================================================ */

  const validateForm = (): boolean => {
    const result = riderSchema.safeParse(formData);

    if (result.success) {
      setFormErrors({});
      return true;
    }

    const errors: FormErrors = {};

    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof RiderFormData;

      if (!errors[field]) {
        errors[field] = issue.message;
      }
    });

    setFormErrors(errors);

    return false;
  };

  /* ============================================================
     Required File Validation
     ============================================================ */

  const validateFiles = (): string | null => {
    if (!profileImage) return "Profile image is required.";
    if (!nidFrontImage) return "NID front image is required.";
    if (!nidBackImage) return "NID back image is required.";
    if (!drivingLicenseFrontImage) {
      return "Driving license front image is required.";
    }
    if (!drivingLicenseBackImage) {
      return "Driving license back image is required.";
    }
    if (!vehicleImage) return "Vehicle image is required.";

    return null;
  };

  /* ============================================================
     Submit
     ============================================================ */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setApiError("");

    const isFormValid = validateForm();

    if (!isFormValid) {
      return;
    }

    const fileError = validateFiles();

    if (fileError) {
      setApiError(fileError);
      return;
    }

    try {
      setLoading(true);

      const multipartData = new FormData();

      multipartData.append("firstName", formData.firstName.trim());
      multipartData.append("lastName", formData.lastName.trim());
      multipartData.append("email", formData.email.trim());
      multipartData.append("phone", formData.phone.trim());
      multipartData.append("password", formData.password);
      multipartData.append("nidNumber", formData.nidNumber.trim());
      multipartData.append(
        "drivingLicenseNumber",
        formData.drivingLicenseNumber.trim(),
      );
      multipartData.append("vehicleType", formData.vehicleType.trim());
      multipartData.append("vehicleNumber", formData.vehicleNumber.trim());

      multipartData.append("profileImage", profileImage!);
      multipartData.append("nidFrontImage", nidFrontImage!);
      multipartData.append("nidBackImage", nidBackImage!);
      multipartData.append(
        "drivingLicenseFrontImage",
        drivingLicenseFrontImage!,
      );
      multipartData.append(
        "drivingLicenseBackImage",
        drivingLicenseBackImage!,
      );
      multipartData.append("vehicleImage", vehicleImage!);

      const response = await axios.post(
        `${API_BASE_URL}/users/rider/register`,
        multipartData,
        {
          withCredentials: true,
        },
      );

      console.log("Rider registration response:", response.data);

      router.push(
        `/verify-email?email=${encodeURIComponent(
          formData.email.trim(),
        )}`,
      );
    } catch (error) {
      console.error("Rider registration error:", error);

      if (isAxiosError(error)) {
        const message = error.response?.data?.message;

        if (Array.isArray(message)) {
          setApiError(message.join(", "));
        } else {
          setApiError(
            message || "Failed to create rider. Please try again.",
          );
        }
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     Render
     ============================================================ */

  return (
    <>
      <RoleBasedNavbar />

      <Loading show={loading} />

      <ErrorMessage
        message={apiError}
        show={Boolean(apiError)}
        onClose={() => setApiError("")}
      />

      <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              ← Back
            </button>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                Create Rider
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Create a new rider account and submit the required
                identity, license, and vehicle documents for
                verification.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ==================================================
                Account Information
                ================================================== */}

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
                      Enter the rider&apos;s basic account information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormInput
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  error={formErrors.firstName}
                  disabled={loading}
                />

                <FormInput
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  error={formErrors.lastName}
                  disabled={loading}
                />

                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="rider@example.com"
                  error={formErrors.email}
                  disabled={loading}
                />

                <FormInput
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="01712345678"
                  error={formErrors.phone}
                  hint="Example: 01712345678"
                  disabled={loading}
                />

                <PasswordInput
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  showPassword={showPassword}
                  onToggle={() => setShowPassword((previous) => !previous)}
                  error={formErrors.password}
                  disabled={loading}
                />

                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  showPassword={showConfirmPassword}
                  onToggle={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  error={formErrors.confirmPassword}
                  disabled={loading}
                />
              </div>
            </section>

            {/* ==================================================
                Rider Information
                ================================================== */}

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    🏍️
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">
                      Rider Information
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Provide the rider&apos;s NID, driving license,
                      and vehicle information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormInput
                  label="NID Number"
                  name="nidNumber"
                  value={formData.nidNumber}
                  onChange={handleInputChange}
                  placeholder="Enter 10 digit NID number"
                  error={formErrors.nidNumber}
                  disabled={loading}
                />

                <FormInput
                  label="Driving License Number"
                  name="drivingLicenseNumber"
                  value={formData.drivingLicenseNumber}
                  onChange={handleInputChange}
                  placeholder="Enter license number"
                  error={formErrors.drivingLicenseNumber}
                  disabled={loading}
                />

                <FormInput
                  label="Vehicle Type"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  placeholder="e.g. Motorcycle"
                  error={formErrors.vehicleType}
                  disabled={loading}
                />

                <FormInput
                  label="Vehicle Number"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. DHAKA-METRO-123456"
                  error={formErrors.vehicleNumber}
                  disabled={loading}
                />
              </div>
            </section>

            {/* ==================================================
                Identity & Vehicle Documents
                ================================================== */}

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    🪪
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">
                      Identity &amp; Vehicle Documents
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Upload all required rider identity, license,
                      and vehicle documents.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <FileUploadCard
                  label="Profile Image"
                  description="Upload rider profile photo"
                  file={profileImage}
                  preview={profilePreview}
                  onChange={(event) =>
                    handleFileChange(event, "profileImage")
                  }
                  onRemove={() => removeFile("profileImage")}
                  disabled={loading}
                  previewClassName="object-cover"
                />

                <FileUploadCard
                  label="NID Front"
                  description="Upload front side of NID"
                  file={nidFrontImage}
                  preview={nidFrontPreview}
                  onChange={(event) =>
                    handleFileChange(event, "nidFrontImage")
                  }
                  onRemove={() => removeFile("nidFrontImage")}
                  disabled={loading}
                />

                <FileUploadCard
                  label="NID Back"
                  description="Upload back side of NID"
                  file={nidBackImage}
                  preview={nidBackPreview}
                  onChange={(event) =>
                    handleFileChange(event, "nidBackImage")
                  }
                  onRemove={() => removeFile("nidBackImage")}
                  disabled={loading}
                />

                <FileUploadCard
                  label="License Front"
                  description="Upload front side of driving license"
                  file={drivingLicenseFrontImage}
                  preview={drivingLicenseFrontPreview}
                  onChange={(event) =>
                    handleFileChange(
                      event,
                      "drivingLicenseFrontImage",
                    )
                  }
                  onRemove={() =>
                    removeFile("drivingLicenseFrontImage")
                  }
                  disabled={loading}
                />

                <FileUploadCard
                  label="License Back"
                  description="Upload back side of driving license"
                  file={drivingLicenseBackImage}
                  preview={drivingLicenseBackPreview}
                  onChange={(event) =>
                    handleFileChange(
                      event,
                      "drivingLicenseBackImage",
                    )
                  }
                  onRemove={() =>
                    removeFile("drivingLicenseBackImage")
                  }
                  disabled={loading}
                />

                <FileUploadCard
                  label="Vehicle Image"
                  description="Upload rider's vehicle photo"
                  file={vehicleImage}
                  preview={vehiclePreview}
                  onChange={(event) =>
                    handleFileChange(event, "vehicleImage")
                  }
                  onRemove={() => removeFile("vehicleImage")}
                  disabled={loading}
                  previewClassName="object-contain"
                />
              </div>

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs leading-5 text-blue-700">
                  All six images are required. Supported formats are
                  JPG, JPEG, PNG and WEBP. Maximum file size is 2 MB
                  per image.
                </p>
              </div>
            </section>

            {/* ==================================================
                Submit Section
                ================================================== */}

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-zinc-900">
                    Create Rider
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Review all information before creating the rider
                    account.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.back()}
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
                    {loading ? "Creating Rider..." : "Create Rider"}
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

/* ============================================================
   Form Input Component
   ============================================================ */

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

function FormInput({
  label,
  name,
  type = "text",
  value,
  placeholder,
  hint,
  error,
  disabled = false,
  onChange,
}: FormInputProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-zinc-700"
      >
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-100 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-zinc-300 focus:border-blue-500 focus:ring-blue-100"
        }`}
      />

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}

/* ============================================================
   Password Input Component
   ============================================================ */

interface PasswordInputProps {
  label: string;
  name: string;
  value: string;
  error?: string;
  disabled?: boolean;
  showPassword: boolean;
  onToggle: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

function PasswordInput({
  label,
  name,
  value,
  error,
  disabled = false,
  showPassword,
  onToggle,
  onChange,
}: PasswordInputProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-zinc-700"
      >
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={
            name === "password"
              ? "Enter password"
              : "Confirm password"
          }
          disabled={disabled}
          className={`w-full rounded-xl border bg-white px-4 py-3 pr-20 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-100 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-zinc-300 focus:border-blue-500 focus:ring-blue-100"
          }`}
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500 transition hover:text-zinc-900 disabled:cursor-not-allowed"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   File Upload Component
   ============================================================ */

interface FileUploadCardProps {
  label: string;
  description: string;
  file: File | null;
  preview: string | null;
  disabled?: boolean;
  previewClassName?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

function FileUploadCard({
  label,
  description,
  file,
  preview,
  disabled = false,
  previewClassName = "object-contain",
  onChange,
  onRemove,
}: FileUploadCardProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-zinc-700">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </p>

      <label className="block cursor-pointer">
        <div className="flex min-h-72 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 transition hover:border-blue-400 hover:bg-blue-50/30">
          {preview ? (
            <img
              src={preview}
              alt={`${label} preview`}
              className={`h-72 w-full ${previewClassName}`}
            />
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
                ↑
              </div>

              <p className="mt-4 text-sm font-semibold text-zinc-700">
                Upload {label}
              </p>

              <p className="mt-1 max-w-xs text-center text-xs leading-5 text-zinc-400">
                {description}
              </p>

              <p className="mt-4 text-xs font-medium text-blue-600">
                Choose Image
              </p>
            </>
          )}
        </div>

        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={onChange}
          disabled={disabled}
          className="hidden"
        />
      </label>

      {file && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-500">
              {file.name}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="ml-3 shrink-0 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
