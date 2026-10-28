"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import ProductLocationPicker, {
    type ProductLocationData,
} from "@/app/products/ProductLocationPicker";

import {
    createProductSchema,
    type CreateProductFormData,
    type CreateProductFormInput,
} from "@/schemas/products/productSchema";

import api from "@/app/lib/axios";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Category {
    id: number;
    categoryId: string;
    name: string;
}

interface CategoryResponse {
    data: Category[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface StepDefinition {
    id: Step;
    number: string;
    title: string;
    shortTitle: string;
    description: string;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7000";

const TOTAL_STEPS = 6;

const STEPS: StepDefinition[] = [
    {
        id: 1,
        number: "01",
        title: "Product Information",
        shortTitle: "Product",
        description: "Tell renters what you are offering.",
    },
    {
        id: 2,
        number: "02",
        title: "Pricing & Rental Rules",
        shortTitle: "Pricing",
        description: "Set your price and rental conditions.",
    },
    {
        id: 3,
        number: "03",
        title: "Rental Schedule",
        shortTitle: "Schedule",
        description: "Define when pickup, rental and return happen.",
    },
    {
        id: 4,
        number: "04",
        title: "Photos & Documents",
        shortTitle: "Media",
        description: "Show the product clearly and add supporting files.",
    },
    {
        id: 5,
        number: "05",
        title: "Pickup Location",
        shortTitle: "Location",
        description: "Tell the rider where the product starts.",
    },
    {
        id: 6,
        number: "06",
        title: "Review & Publish",
        shortTitle: "Review",
        description: "Review everything before publishing.",
    },
];

/* -------------------------------------------------------------------------- */
/* Safe helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The Zod schema may expose some fields as unknown/object-like values to
 * React Hook Form's input type. Never pass those values directly to Date.
 */
const toDate = (value: unknown): Date | null => {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value !== "string" && typeof value !== "number") {
        return null;
    }

    if (!value) {
        return null;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
};

const toDateInputValue = (value: unknown): string => {
    if (typeof value === "string") {
        return value;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");
        const hours = String(value.getHours()).padStart(2, "0");
        const minutes = String(value.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    if (typeof value === "number") {
        const parsed = new Date(value);

        if (!Number.isNaN(parsed.getTime())) {
            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, "0");
            const day = String(parsed.getDate()).padStart(2, "0");
            const hours = String(parsed.getHours()).padStart(2, "0");
            const minutes = String(parsed.getMinutes()).padStart(2, "0");

            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    }

    return "";
};

const formatDateTime = (value: unknown): string => {
    const date = toDate(value);

    if (!date) {
        return "Not set";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
};

const formatDateOnly = (value: unknown): string => {
    const date = toDate(value);

    if (!date) {
        return "Not set";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};

const formatMoney = (value: unknown): string => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return new Intl.NumberFormat("en-BD").format(number);
};

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function Icon({
    name,
    size = 20,
}: {
    name:
        | "arrow-left"
        | "arrow-right"
        | "check"
        | "image"
        | "file"
        | "location"
        | "calendar"
        | "clock"
        | "package"
        | "money"
        | "shield"
        | "refresh"
        | "x"
        | "chevron";
    size?: number;
}) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    };

    switch (name) {
        case "arrow-left":
            return (
                <svg {...common}>
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                </svg>
            );

        case "arrow-right":
            return (
                <svg {...common}>
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                </svg>
            );

        case "check":
            return (
                <svg {...common}>
                    <path d="m5 12 4 4L19 6" />
                </svg>
            );

        case "image":
            return (
                <svg {...common}>
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="8.5" cy="9" r="1.5" />
                    <path d="m21 15-5-5L5 20" />
                </svg>
            );

        case "file":
            return (
                <svg {...common}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M8 13h8" />
                    <path d="M8 17h6" />
                </svg>
            );

        case "location":
            return (
                <svg {...common}>
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                </svg>
            );

        case "calendar":
            return (
                <svg {...common}>
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <path d="M16 2v4" />
                    <path d="M8 2v4" />
                    <path d="M3 10h18" />
                </svg>
            );

        case "clock":
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                </svg>
            );

        case "package":
            return (
                <svg {...common}>
                    <path d="m16.5 9.4-9-5.19" />
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="M3.3 7 12 12l8.7-5" />
                    <path d="M12 22V12" />
                </svg>
            );

        case "money":
            return (
                <svg {...common}>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M7 9h.01M17 15h.01" />
                </svg>
            );

        case "shield":
            return (
                <svg {...common}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                    <path d="m9 12 2 2 4-4" />
                </svg>
            );

        case "refresh":
            return (
                <svg {...common}>
                    <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
                    <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
                </svg>
            );

        case "x":
            return (
                <svg {...common}>
                    <path d="m6 6 12 12" />
                    <path d="m18 6-12 12" />
                </svg>
            );

        case "chevron":
            return (
                <svg {...common}>
                    <path d="m9 18 6-6-6-6" />
                </svg>
            );

        default:
            return null;
    }
}

function FieldError({
    message,
}: {
    message?: string;
}) {
    if (!message) return null;

    return (
        <p className="mt-2 text-sm font-medium text-red-600">
            {message}
        </p>
    );
}

function SectionHeader({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                {eyebrow}
            </p>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {title}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {description}
            </p>
        </div>
    );
}

function Toggle({
    checked,
    onChange,
    title,
    description,
}: {
    checked: boolean;
    onChange: () => void;
    title: string;
    description: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
        >
            <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">
                    {title}
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {description}
                </span>
            </span>

            <span
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    checked ? "bg-blue-600" : "bg-slate-300"
                }`}
            >
                <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        checked ? "left-5" : "left-0.5"
                    }`}
                />
            </span>
        </button>
    );
}

function DateField({
    id,
    label,
    description,
    value,
    error,
    onChange,
}: {
    id: string;
    label: string;
    description: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-semibold text-slate-800"
            >
                {label}
            </label>

            <input
                id={id}
                type="datetime-local"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                    error
                        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                }`}
            />

            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                {description}
            </p>

            <FieldError message={error} />
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CreateProductPage() {
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [authChecking, setAuthChecking] = useState(true);

    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);

    const [productLocation, setProductLocation] =
        useState<ProductLocationData>({
            latitude: null,
            longitude: null,
            division: "",
            district: "",
            upazila: "",
            pickupAddress: "",
        });

    const [locationError, setLocationError] = useState("");
    const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState("");
    const [categoryRetry, setCategoryRetry] = useState(0);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        getValues,
        trigger,
        formState: { errors, isSubmitting },
    } = useForm<
        CreateProductFormInput,
        unknown,
        CreateProductFormData
    >({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            name: "",
            description: "",
            categoryId: "",
            pricePerDay: "",
            negotiationAllowed: true,
            minRentalDays: 1,
            maxRentalDays: 7,
            preparationBufferDays: 0,
            allowSameDayRental: false,
            images: [],
            documents: [],
            rentalWindowStart: "",
            rentalWindowEnd: "",
            deliveryWindowStart: "",
            deliveryWindowEnd: "",
            returnWindowStart: "",
            returnWindowEnd: "",
        },
    });

    /* ---------------------------------------------------------------------- */
    /* Watched values                                                        */
    /* ---------------------------------------------------------------------- */

    const name = String(watch("name") ?? "");
    const description = String(watch("description") ?? "");
    const categoryId = String(watch("categoryId") ?? "");
    const pricePerDay = String(watch("pricePerDay") ?? "");

    const negotiationAllowed = Boolean(
        watch("negotiationAllowed"),
    );

    const allowSameDayRental = Boolean(
        watch("allowSameDayRental"),
    );

    const minRentalDays = Number(
        watch("minRentalDays") ?? 1,
    );

    const maxRentalDays = Number(
        watch("maxRentalDays") ?? 7,
    );

    const preparationBufferDays = Number(
        watch("preparationBufferDays") ?? 0,
    );

    const rentalWindowStart = toDateInputValue(
        watch("rentalWindowStart"),
    );

    const rentalWindowEnd = toDateInputValue(
        watch("rentalWindowEnd"),
    );

    const deliveryWindowStart = toDateInputValue(
        watch("deliveryWindowStart"),
    );

    const deliveryWindowEnd = toDateInputValue(
        watch("deliveryWindowEnd"),
    );

    const returnWindowStart = toDateInputValue(
        watch("returnWindowStart"),
    );

    const returnWindowEnd = toDateInputValue(
        watch("returnWindowEnd"),
    );

    const selectedCategory = useMemo(
        () =>
            categories.find(
                (category) => category.categoryId === categoryId,
            ),
        [categories, categoryId],
    );

    const rentalDurationText = useMemo(() => {
        if (!rentalWindowStart || !rentalWindowEnd) {
            return "Set the rental dates";
        }

        const start = toDate(rentalWindowStart);
        const end = toDate(rentalWindowEnd);

        if (!start || !end || end <= start) {
            return "Invalid rental period";
        }

        const diff =
            end.getTime() - start.getTime();

        const days = Math.ceil(
            diff / (1000 * 60 * 60 * 24),
        );

        if (days <= 1) {
            return "1 day";
        }

        return `${days} days`;
    }, [rentalWindowStart, rentalWindowEnd]);

    /* ---------------------------------------------------------------------- */
    /* Authentication                                                         */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        let mounted = true;

        const checkUserAccess = async () => {
            try {
                const response = await api.get(
                    "/auth/profile",
                    {
                        withCredentials: true,
                    },
                );

                const role = response.data.role;

                if (role !== "USER") {
                    router.replace("/login");
                    return;
                }

                if (mounted) {
                    setAuthChecking(false);
                }
            } catch (error) {
                console.error(
                    "Authentication check failed:",
                    error,
                );

                router.replace("/login");
            }
        };

        void checkUserAccess();

        return () => {
            mounted = false;
        };
    }, [router]);

    /* ---------------------------------------------------------------------- */
    /* Categories                                                             */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        let mounted = true;

        const fetchCategories = async () => {
            try {
                setIsLoadingCategories(true);
                setCategoryError("");

                const response =
                    await axios.get<CategoryResponse>(
                        `${API_BASE_URL}/categories`,
                        {
                            params: {
                                page: 1,
                                limit: 100,
                            },
                            withCredentials: true,
                        },
                    );

                if (mounted) {
                    setCategories(
                        response.data.data,
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to fetch categories:",
                    error,
                );

                if (mounted) {
                    setCategoryError(
                        "Failed to load categories. Please try again.",
                    );
                }
            } finally {
                if (mounted) {
                    setIsLoadingCategories(false);
                }
            }
        };

        void fetchCategories();

        return () => {
            mounted = false;
        };
    }, [categoryRetry]);

    /* ---------------------------------------------------------------------- */
    /* File handlers                                                          */
    /* ---------------------------------------------------------------------- */

    const handleImageChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(
            event.target.files ?? [],
        );

        if (files.length === 0) {
            return;
        }

        const availableSlots =
            Math.max(
                0,
                10 - selectedImages.length,
            );

        const acceptedFiles = files
            .filter(
                (file) =>
                    !selectedImages.some(
                        (existingFile) =>
                            existingFile.name ===
                                file.name &&
                            existingFile.size ===
                                file.size &&
                            existingFile.lastModified ===
                                file.lastModified,
                    ),
            )
            .slice(0, availableSlots);

        const combined = [
            ...selectedImages,
            ...acceptedFiles,
        ];

        setSelectedImages(combined);

        setValue(
            "images",
            combined,
            {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            },
        );

        event.target.value = "";
    };

    const handleRemoveImage = (
        index: number,
    ) => {
        const updated =
            selectedImages.filter(
                (_, imageIndex) =>
                    imageIndex !== index,
            );

        setSelectedImages(updated);

        setValue(
            "images",
            updated,
            {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            },
        );
    };

    const handleDocumentChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(
            event.target.files ?? [],
        );

        if (files.length === 0) {
            return;
        }

        const availableSlots =
            Math.max(
                0,
                5 - selectedDocuments.length,
            );

        const acceptedFiles = files
            .filter(
                (file) =>
                    !selectedDocuments.some(
                        (existingFile) =>
                            existingFile.name ===
                                file.name &&
                            existingFile.size ===
                                file.size &&
                            existingFile.lastModified ===
                                file.lastModified,
                    ),
            )
            .slice(0, availableSlots);

        const combined = [
            ...selectedDocuments,
            ...acceptedFiles,
        ];

        setSelectedDocuments(combined);

        setValue(
            "documents",
            combined,
            {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            },
        );

        event.target.value = "";
    };

    const handleRemoveDocument = (
        index: number,
    ) => {
        const updated =
            selectedDocuments.filter(
                (_, documentIndex) =>
                    documentIndex !== index,
            );

        setSelectedDocuments(updated);

        setValue(
            "documents",
            updated,
            {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            },
        );
    };

    /* ---------------------------------------------------------------------- */
    /* Step validation                                                        */
    /* ---------------------------------------------------------------------- */

    const validateSchedule = () => {
        const values = getValues();

        const rentalStart = toDate(
            values.rentalWindowStart,
        );

        const rentalEnd = toDate(
            values.rentalWindowEnd,
        );

        const deliveryStart = toDate(
            values.deliveryWindowStart,
        );

        const deliveryEnd = toDate(
            values.deliveryWindowEnd,
        );

        const returnStart = toDate(
            values.returnWindowStart,
        );

        const returnEnd = toDate(
            values.returnWindowEnd,
        );

        const checks: string[] = [];

        if (
            rentalStart &&
            rentalEnd &&
            rentalStart >= rentalEnd
        ) {
            checks.push(
                "Rental start must be before rental end.",
            );
        }

        if (
            deliveryStart &&
            deliveryEnd &&
            deliveryStart >= deliveryEnd
        ) {
            checks.push(
                "Pickup start must be before pickup deadline.",
            );
        }

        if (
            returnStart &&
            returnEnd &&
            returnStart >= returnEnd
        ) {
            checks.push(
                "Return start must be before the return deadline.",
            );
        }

        if (
            deliveryEnd &&
            rentalStart &&
            deliveryEnd > rentalStart
        ) {
            checks.push(
                "The rider pickup deadline must be before the rental starts.",
            );
        }

        if (
            deliveryStart &&
            rentalStart &&
            rentalStart < deliveryStart
        ) {
            checks.push(
                "The rental cannot start before the rider pickup window begins.",
            );
        }

        if (
            rentalEnd &&
            returnStart &&
            returnStart < rentalEnd
        ) {
            checks.push(
                "The return window must start after the rental ends.",
            );
        }

        if (checks.length > 0) {
            window.alert(
                checks.join("\n"),
            );
            return false;
        }

        return true;
    };

    const validateStep = async (
        step: Step,
    ): Promise<boolean> => {
        if (step === 1) {
            return trigger([
                "name",
                "description",
                "categoryId",
            ]);
        }

        if (step === 2) {
            const valid = await trigger([
                "pricePerDay",
                "minRentalDays",
                "maxRentalDays",
                "preparationBufferDays",
            ]);

            if (!valid) {
                return false;
            }

            const min = Number(
                getValues("minRentalDays"),
            );

            const max = Number(
                getValues("maxRentalDays"),
            );

            if (min > max) {
                window.alert(
                    "Minimum rental days cannot exceed maximum rental days.",
                );

                return false;
            }

            return true;
        }

        if (step === 3) {
            const valid = await trigger([
                "rentalWindowStart",
                "rentalWindowEnd",
                "deliveryWindowStart",
                "deliveryWindowEnd",
                "returnWindowStart",
                "returnWindowEnd",
            ]);

            if (!valid) {
                return false;
            }

            return validateSchedule();
        }

        if (step === 4) {
            const validImages =
                await trigger("images");

            const validDocuments =
                await trigger("documents");

            return (
                validImages &&
                validDocuments
            );
        }

        if (step === 5) {
            if (
                !isLocationConfirmed ||
                productLocation.latitude === null ||
                productLocation.longitude === null ||
                !productLocation.division.trim() ||
                !productLocation.district.trim() ||
                !productLocation.upazila.trim() ||
                !productLocation.pickupAddress.trim()
            ) {
                setLocationError(
                    "Please select and confirm a complete pickup location before continuing.",
                );

                return false;
            }

            setLocationError("");

            return true;
        }

        return true;
    };

    const goNext = async () => {
        const valid =
            await validateStep(
                currentStep,
            );

        if (!valid) {
            return;
        }

        if (
            currentStep <
            TOTAL_STEPS
        ) {
            setCurrentStep(
                (currentStep + 1) as Step,
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    };

    const goBack = () => {
        if (currentStep > 1) {
            setCurrentStep(
                (currentStep - 1) as Step,
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Submit                                                                 */
    /* ---------------------------------------------------------------------- */

    const onSubmit = async (
        data: CreateProductFormData,
    ) => {
        if (
            !isLocationConfirmed ||
            productLocation.latitude === null ||
            productLocation.longitude === null ||
            !productLocation.division.trim() ||
            !productLocation.district.trim() ||
            !productLocation.upazila.trim() ||
            !productLocation.pickupAddress.trim()
        ) {
            setLocationError(
                "Please select, complete, and confirm the product pickup location before submitting.",
            );

            setCurrentStep(5);

            return;
        }

        if (!validateSchedule()) {
            setCurrentStep(3);
            return;
        }

        setLocationError("");

        const formData =
            new FormData();

        formData.append(
            "name",
            data.name.trim(),
        );

        formData.append(
            "description",
            data.description.trim(),
        );

        formData.append(
            "categoryId",
            String(data.categoryId),
        );

        formData.append(
            "pricePerDay",
            String(
                Number(data.pricePerDay),
            ),
        );

        formData.append(
            "negotiationAllowed",
            String(
                data.negotiationAllowed,
            ),
        );

        formData.append(
            "minRentalDays",
            String(
                data.minRentalDays,
            ),
        );

        formData.append(
            "maxRentalDays",
            String(
                data.maxRentalDays,
            ),
        );

        formData.append(
            "preparationBufferDays",
            String(
                data.preparationBufferDays,
            ),
        );

        formData.append(
            "allowSameDayRental",
            String(
                data.allowSameDayRental,
            ),
        );

        const rentalStart =
            toDateInputValue(
                data.rentalWindowStart,
            );

        const rentalEnd =
            toDateInputValue(
                data.rentalWindowEnd,
            );

        const deliveryStart =
            toDateInputValue(
                data.deliveryWindowStart,
            );

        const deliveryEnd =
            toDateInputValue(
                data.deliveryWindowEnd,
            );

        const returnStart =
            toDateInputValue(
                data.returnWindowStart,
            );

        const returnEnd =
            toDateInputValue(
                data.returnWindowEnd,
            );

        if (rentalStart) {
            formData.append(
                "rentalWindowStart",
                rentalStart,
            );
        }

        if (rentalEnd) {
            formData.append(
                "rentalWindowEnd",
                rentalEnd,
            );
        }

        if (deliveryStart) {
            formData.append(
                "deliveryWindowStart",
                deliveryStart,
            );
        }

        if (deliveryEnd) {
            formData.append(
                "deliveryWindowEnd",
                deliveryEnd,
            );
        }

        if (returnStart) {
            formData.append(
                "returnWindowStart",
                returnStart,
            );
        }

        if (returnEnd) {
            formData.append(
                "returnWindowEnd",
                returnEnd,
            );
        }

        formData.append(
            "latitude",
            String(
                productLocation.latitude,
            ),
        );

        formData.append(
            "longitude",
            String(
                productLocation.longitude,
            ),
        );

        formData.append(
            "division",
            productLocation.division.trim(),
        );

        formData.append(
            "district",
            productLocation.district.trim(),
        );

        formData.append(
            "upazila",
            productLocation.upazila.trim(),
        );

        formData.append(
            "pickupAddress",
            productLocation.pickupAddress.trim(),
        );

        data.images.forEach(
            (image) => {
                formData.append(
                    "productImages",
                    image,
                );
            },
        );

        data.documents.forEach(
            (document) => {
                formData.append(
                    "productDocuments",
                    document,
                );
            },
        );

        try {
            const response =
                await axios.post(
                    `${API_BASE_URL}/products/createProduct`,
                    formData,
                    {
                        withCredentials: true,
                    },
                );

            console.log(
                "Product created successfully:",
                response.data,
            );

            window.alert(
                "Product created successfully!",
            );

            router.push(
                "/products/my-products",
            );
        } catch (error) {
            if (
                axios.isAxiosError(
                    error,
                )
            ) {
                console.error(
                    "Product creation failed:",
                    error.response?.data ??
                        error.message,
                );

                const message =
                    error.response?.data
                        ?.message;

                window.alert(
                    Array.isArray(message)
                        ? message.join("\n")
                        : message ??
                              "Failed to create product. Please check your inputs and try again.",
                );
            } else {
                console.error(
                    "Unexpected error:",
                    error,
                );

                window.alert(
                    "An unexpected error occurred.",
                );
            }
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Auth loading                                                           */
    /* ---------------------------------------------------------------------- */

    if (authChecking) {
        return (
            <>
                <RoleBasedNavbar />

                <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 px-4">
                    <div className="text-center">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                        <p className="mt-4 text-sm font-medium text-slate-600">
                            Checking your account...
                        </p>
                    </div>
                </main>
            </>
        );
    }

    /* ---------------------------------------------------------------------- */
    /* Render                                                                 */
    /* ---------------------------------------------------------------------- */

    return (
        <>
            <RoleBasedNavbar />

            <main className="min-h-screen bg-[#f6f8fb]">
                {/* Header */}
                <div className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <Link
                                    href="/products/my-products"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                                >
                                    <Icon
                                        name="arrow-left"
                                        size={17}
                                    />

                                    My Products
                                </Link>

                                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                    Create a new product
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                    Complete the listing details,
                                    rental rules, schedule and pickup
                                    information before publishing.
                                </p>
                            </div>

                            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 sm:block">
                                Step {currentStep} of{" "}
                                {TOTAL_STEPS}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile progress */}
                <div className="border-b border-slate-200 bg-white lg:hidden">
                    <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between gap-2">
                            {STEPS.map(
                                (step) => {
                                    const completed =
                                        step.id <
                                        currentStep;

                                    const active =
                                        step.id ===
                                        currentStep;

                                    return (
                                        <button
                                            key={
                                                step.id
                                            }
                                            type="button"
                                            onClick={async () => {
                                                if (
                                                    step.id <
                                                    currentStep
                                                ) {
                                                    setCurrentStep(
                                                        step.id,
                                                    );
                                                }
                                            }}
                                            className="flex min-w-0 flex-1 flex-col items-center gap-2"
                                        >
                                            <span
                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                                    completed
                                                        ? "bg-emerald-600 text-white"
                                                        : active
                                                          ? "bg-blue-600 text-white"
                                                          : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                {completed ? (
                                                    <Icon
                                                        name="check"
                                                        size={
                                                            15
                                                        }
                                                    />
                                                ) : (
                                                    step.id
                                                )}
                                            </span>

                                            <span
                                                className={`truncate text-[10px] font-semibold ${
                                                    active
                                                        ? "text-slate-900"
                                                        : "text-slate-400"
                                                }`}
                                            >
                                                {
                                                    step.shortTitle
                                                }
                                            </span>
                                        </button>
                                    );
                                },
                            )}
                        </div>

                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                                style={{
                                    width: `${
                                        (currentStep /
                                            TOTAL_STEPS) *
                                        100
                                    }%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:px-8 lg:py-8">
                    {/* Desktop step navigation */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="px-3 pb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                Create Listing
                            </p>

                            <div className="space-y-1">
                                {STEPS.map(
                                    (step) => {
                                        const active =
                                            currentStep ===
                                            step.id;

                                        const completed =
                                            step.id <
                                            currentStep;

                                        return (
                                            <button
                                                key={
                                                    step.id
                                                }
                                                type="button"
                                                disabled={
                                                    step.id >
                                                    currentStep
                                                }
                                                onClick={() =>
                                                    setCurrentStep(
                                                        step.id,
                                                    )
                                                }
                                                className={`group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition ${
                                                    active
                                                        ? "bg-blue-50"
                                                        : "hover:bg-slate-50"
                                                } ${
                                                    step.id >
                                                    currentStep
                                                        ? "cursor-not-allowed opacity-50"
                                                        : ""
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                                        completed
                                                            ? "bg-emerald-600 text-white"
                                                            : active
                                                              ? "bg-blue-600 text-white"
                                                              : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    {completed ? (
                                                        <Icon
                                                            name="check"
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    ) : (
                                                        step.number
                                                    )}
                                                </span>

                                                <span className="min-w-0">
                                                    <span
                                                        className={`block text-sm font-bold ${
                                                            active
                                                                ? "text-blue-900"
                                                                : "text-slate-800"
                                                        }`}
                                                    >
                                                        {
                                                            step.title
                                                        }
                                                    </span>

                                                    <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                                                        {
                                                            step.description
                                                        }
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* Main form */}
                    <form
                        onSubmit={handleSubmit(
                            onSubmit,
                        )}
                        noValidate
                        className="min-w-0"
                    >
                        {/* -------------------------------------------------- */}
                        {/* STEP 1 */}
                        {/* -------------------------------------------------- */}

                        {currentStep === 1 && (
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <SectionHeader
                                    eyebrow="01 / Product Information"
                                    title="What are you renting out?"
                                    description="Give renters enough information to understand exactly what they are getting."
                                />

                                <div className="space-y-6">
                                    <div>
                                        <label
                                            htmlFor="product-name"
                                            className="mb-2 block text-sm font-semibold text-slate-800"
                                        >
                                            Product name
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            id="product-name"
                                            type="text"
                                            maxLength={150}
                                            placeholder="e.g. Bosch Professional Electric Drill"
                                            {...register(
                                                "name",
                                            )}
                                            className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                                                errors.name
                                                    ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                                                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        />

                                        <div className="mt-2 flex justify-between gap-3">
                                            <FieldError
                                                message={
                                                    errors.name
                                                        ?.message
                                                }
                                            />

                                            <span className="ml-auto text-xs text-slate-400">
                                                {
                                                    name.length
                                                }
                                                /150
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="category-id"
                                            className="mb-2 block text-sm font-semibold text-slate-800"
                                        >
                                            Category
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            id="category-id"
                                            {...register(
                                                "categoryId",
                                            )}
                                            disabled={
                                                isLoadingCategories ||
                                                categories.length ===
                                                    0
                                            }
                                            className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                                                errors.categoryId
                                                    ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                                                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        >
                                            <option value="">
                                                {isLoadingCategories
                                                    ? "Loading categories..."
                                                    : categories.length ===
                                                        0
                                                      ? "No categories available"
                                                      : "Select a category"}
                                            </option>

                                            {categories.map(
                                                (
                                                    category,
                                                ) => (
                                                    <option
                                                        key={
                                                            category.categoryId
                                                        }
                                                        value={
                                                            category.categoryId
                                                        }
                                                    >
                                                        {
                                                            category.name
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>

                                        <FieldError
                                            message={
                                                errors.categoryId
                                                    ?.message
                                            }
                                        />

                                        {categoryError && (
                                            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
                                                <p className="text-sm text-red-700">
                                                    {
                                                        categoryError
                                                    }
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCategoryRetry(
                                                            (
                                                                value,
                                                            ) =>
                                                                value +
                                                                1,
                                                        )
                                                    }
                                                    className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900"
                                                >
                                                    <Icon
                                                        name="refresh"
                                                        size={
                                                            14
                                                        }
                                                    />
                                                    Retry
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="product-description"
                                            className="mb-2 block text-sm font-semibold text-slate-800"
                                        >
                                            Product description
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <textarea
                                            id="product-description"
                                            rows={7}
                                            placeholder="Describe the product, condition, important features, included accessories and anything a renter should know."
                                            {...register(
                                                "description",
                                            )}
                                            className={`w-full resize-y rounded-xl border bg-white px-4 py-3.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                                                errors.description
                                                    ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                                                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        />

                                        <div className="mt-2 flex justify-between gap-3">
                                            <FieldError
                                                message={
                                                    errors.description
                                                        ?.message
                                                }
                                            />

                                            <span className="ml-auto text-xs text-slate-400">
                                                {
                                                    description.length
                                                }
                                                chars
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                        <div className="flex gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                                                <Icon
                                                    name="package"
                                                    size={
                                                        17
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-blue-950">
                                                    Make the listing
                                                    specific
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-blue-800">
                                                    Clear descriptions
                                                    reduce questions,
                                                    improve renter trust
                                                    and make the handover
                                                    process smoother.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* -------------------------------------------------- */}
                        {/* STEP 2 */}
                        {/* -------------------------------------------------- */}

                        {currentStep === 2 && (
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <SectionHeader
                                    eyebrow="02 / Pricing & Rental Rules"
                                    title="Set your rental conditions"
                                    description="Define your daily price, rental duration and negotiation preferences."
                                />

                                <div className="space-y-6">
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="price-per-day"
                                                className="mb-2 block text-sm font-semibold text-slate-800"
                                            >
                                                Price per day
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                                                    ৳
                                                </span>

                                                <input
                                                    id="price-per-day"
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    placeholder="500"
                                                    {...register(
                                                        "pricePerDay",
                                                    )}
                                                    className={`w-full rounded-xl border bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                                                        errors.pricePerDay
                                                            ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                                                            : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                                                    }`}
                                                />
                                            </div>

                                            <FieldError
                                                message={
                                                    errors.pricePerDay
                                                        ?.message
                                                }
                                            />
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                                                    <Icon
                                                        name="money"
                                                        size={
                                                            19
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        Your rate
                                                    </p>

                                                    <p className="mt-1 text-lg font-bold text-slate-950">
                                                        ৳
                                                        {formatMoney(
                                                            pricePerDay,
                                                        )}
                                                        <span className="ml-1 text-xs font-medium text-slate-400">
                                                            / day
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-3">
                                        <div>
                                            <label
                                                htmlFor="min-rental-days"
                                                className="mb-2 block text-sm font-semibold text-slate-800"
                                            >
                                                Minimum rental
                                            </label>

                                            <input
                                                id="min-rental-days"
                                                type="number"
                                                min={1}
                                                max={30}
                                                step={1}
                                                {...register(
                                                    "minRentalDays",
                                                    {
                                                        valueAsNumber:
                                                            true,
                                                    },
                                                )}
                                                className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.minRentalDays
                                                        ? "border-red-500 focus:ring-red-100"
                                                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            />

                                            <p className="mt-1.5 text-xs text-slate-400">
                                                Minimum days
                                            </p>

                                            <FieldError
                                                message={
                                                    errors.minRentalDays
                                                        ?.message
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="max-rental-days"
                                                className="mb-2 block text-sm font-semibold text-slate-800"
                                            >
                                                Maximum rental
                                            </label>

                                            <input
                                                id="max-rental-days"
                                                type="number"
                                                min={1}
                                                max={30}
                                                step={1}
                                                {...register(
                                                    "maxRentalDays",
                                                    {
                                                        valueAsNumber:
                                                            true,
                                                    },
                                                )}
                                                className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.maxRentalDays
                                                        ? "border-red-500 focus:ring-red-100"
                                                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            />

                                            <p className="mt-1.5 text-xs text-slate-400">
                                                Maximum days
                                            </p>

                                            <FieldError
                                                message={
                                                    errors.maxRentalDays
                                                        ?.message
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="preparation-buffer-days"
                                                className="mb-2 block text-sm font-semibold text-slate-800"
                                            >
                                                Preparation buffer
                                            </label>

                                            <input
                                                id="preparation-buffer-days"
                                                type="number"
                                                min={0}
                                                max={30}
                                                step={1}
                                                {...register(
                                                    "preparationBufferDays",
                                                    {
                                                        valueAsNumber:
                                                            true,
                                                    },
                                                )}
                                                className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none focus:ring-2 ${
                                                    errors.preparationBufferDays
                                                        ? "border-red-500 focus:ring-red-100"
                                                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                                                }`}
                                            />

                                            <p className="mt-1.5 text-xs text-slate-400">
                                                Days needed to prepare
                                            </p>

                                            <FieldError
                                                message={
                                                    errors.preparationBufferDays
                                                        ?.message
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Toggle
                                            checked={
                                                negotiationAllowed
                                            }
                                            onChange={() =>
                                                setValue(
                                                    "negotiationAllowed",
                                                    !negotiationAllowed,
                                                    {
                                                        shouldDirty:
                                                            true,
                                                        shouldValidate:
                                                            true,
                                                    },
                                                )
                                            }
                                            title="Allow price negotiation"
                                            description="Let renters make an offer instead of accepting only the listed daily price."
                                        />

                                        <Toggle
                                            checked={
                                                allowSameDayRental
                                            }
                                            onChange={() =>
                                                setValue(
                                                    "allowSameDayRental",
                                                    !allowSameDayRental,
                                                    {
                                                        shouldDirty:
                                                            true,
                                                        shouldValidate:
                                                            true,
                                                    },
                                                )
                                            }
                                            title="Allow same-day rental"
                                            description="Allow a rental to start on the same day when the schedule permits it."
                                        />
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="flex gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                                                <Icon
                                                    name="shield"
                                                    size={
                                                        17
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    Rental rule summary
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    Renters can choose
                                                    between{" "}
                                                    <strong>
                                                        {
                                                            minRentalDays
                                                        }
                                                    </strong>{" "}
                                                    and{" "}
                                                    <strong>
                                                        {
                                                            maxRentalDays
                                                        }
                                                    </strong>{" "}
                                                    days. Your preparation
                                                    buffer is{" "}
                                                    <strong>
                                                        {
                                                            preparationBufferDays
                                                        }
                                                    </strong>{" "}
                                                    day(s).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* -------------------------------------------------- */}
                        {/* STEP 3 */}
                        {/* -------------------------------------------------- */}

                        {currentStep === 3 && (
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <SectionHeader
                                    eyebrow="03 / Rental Schedule"
                                    title="Build the rental journey"
                                    description="Set the timing for rider pickup, renter use and product return."
                                />

                                <div className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                    <div className="flex flex-col sm:flex-row">
                                        {[
                                            {
                                                label: "Rider Pickup",
                                                icon: "package" as const,
                                            },
                                            {
                                                label: "Rental Starts",
                                                icon: "calendar" as const,
                                            },
                                            {
                                                label: "Rental Ends",
                                                icon: "calendar" as const,
                                            },
                                            {
                                                label: "Product Return",
                                                icon: "clock" as const,
                                            },
                                        ].map(
                                            (
                                                item,
                                                index,
                                            ) => (
                                                <div
                                                    key={
                                                        item.label
                                                    }
                                                    className="flex flex-1 items-center gap-3 border-b border-slate-200 px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                                                        <Icon
                                                            name={
                                                                item.icon
                                                            }
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">
                                                            {
                                                                item.label
                                                            }
                                                        </p>

                                                        {index <
                                                            3 && (
                                                            <p className="text-[10px] text-slate-400">
                                                                ↓
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <div className="mb-5 flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                                <Icon
                                                    name="package"
                                                    size={
                                                        19
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <h3 className="text-base font-bold text-slate-950">
                                                    When can the rider
                                                    collect your product?
                                                </h3>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    This is the window
                                                    during which you can
                                                    hand the product to
                                                    the assigned rider.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <DateField
                                                id="delivery-window-start"
                                                label="Earliest pickup"
                                                description="When you can first hand the product to the rider."
                                                value={
                                                    deliveryWindowStart
                                                }
                                                error={
                                                    errors
                                                        .deliveryWindowStart
                                                        ?.message
                                                }
                                                onChange={(
                                                    value,
                                                ) =>
                                                    setValue(
                                                        "deliveryWindowStart",
                                                        value,
                                                        {
                                                            shouldDirty:
                                                                true,
                                                            shouldValidate:
                                                                true,
                                                        },
                                                    )
                                                }
                                            />

                                            <DateField
                                                id="delivery-window-end"
                                                label="Pickup deadline"
                                                description="Latest time the rider can collect the product."
                                                value={
                                                    deliveryWindowEnd
                                                }
                                                error={
                                                    errors
                                                        .deliveryWindowEnd
                                                        ?.message
                                                }
                                                onChange={(
                                                    value,
                                                ) =>
                                                    setValue(
                                                        "deliveryWindowEnd",
                                                        value,
                                                        {
                                                            shouldDirty:
                                                                true,
                                                            shouldValidate:
                                                                true,
                                                        },
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-200" />

                                    <div>
                                        <div className="mb-5 flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                                <Icon
                                                    name="calendar"
                                                    size={
                                                        19
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <h3 className="text-base font-bold text-slate-950">
                                                    When will the renter
                                                    use your product?
                                                </h3>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    This defines the actual
                                                    rental period.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <DateField
                                                id="rental-window-start"
                                                label="Rental starts"
                                                description="The earliest time the renter may begin using the product."
                                                value={
                                                    rentalWindowStart
                                                }
                                                error={
                                                    errors
                                                        .rentalWindowStart
                                                        ?.message
                                                }
                                                onChange={(
                                                    value,
                                                ) =>
                                                    setValue(
                                                        "rentalWindowStart",
                                                        value,
                                                        {
                                                            shouldDirty:
                                                                true,
                                                            shouldValidate:
                                                                true,
                                                        },
                                                    )
                                                }
                                            />

                                            <DateField
                                                id="rental-window-end"
                                                label="Rental ends"
                                                description="The time the renter's use of the product ends."
                                                value={
                                                    rentalWindowEnd
                                                }
                                                error={
                                                    errors
                                                        .rentalWindowEnd
                                                        ?.message
                                                }
                                                onChange={(
                                                    value,
                                                ) =>
                                                    setValue(
                                                        "rentalWindowEnd",
                                                        value,
                                                        {
                                                            shouldDirty:
                                                                true,
                                                            shouldValidate:
                                                                true,
                                                        },
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                            <p className="text-sm font-semibold text-emerald-900">
                                                Planned rental duration:{" "}
                                                {
                                                    rentalDurationText
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-200" />

                                    <div>
                                        <div className="mb-5 flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                                <Icon
                                                    name="clock"
                                                    size={
                                                        19
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <h3 className="text-base font-bold text-slate-950">
                                                    When should the product
                                                    come back to you?
                                                </h3>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    Set the earliest return
                                                    time and final return
                                                    deadline.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <DateField
                                                id="return-window-start"
                                                label="Return starts"
                                                description="Earliest time the product can be returned to you."
                                                value={
                                                    returnWindowStart
                                                }
                                                error={
                                                    errors
                                                        .returnWindowStart
                                                        ?.message
                                                }
                                                onChange={(
                                                    value,
                                                ) =>
                                                    setValue(
                                                        "returnWindowStart",
                                                        value,
                                                        {
                                                            shouldDirty:
                                                                true,
                                                            shouldValidate:
                                                                true,
                                                        },
                                                    )
                                                }
                                            />

                                            <DateField
                                                id="return-window-end"
                                                label="Return deadline"
                                                description="Latest time the product must be returned."
                                                value={
                                                    returnWindowEnd
                                                }
                                                error={
                                                    errors
                                                        .returnWindowEnd
                                                        ?.message
                                                }
                                                onChange={(
                                                    value,
                                                ) =>
                                                    setValue(
                                                        "returnWindowEnd",
                                                        value,
                                                        {
                                                            shouldDirty:
                                                                true,
                                                            shouldValidate:
                                                                true,
                                                        },
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                            Schedule logic
                                        </p>

                                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Rider pickup deadline
                                                </p>

                                                <p className="mt-1 text-sm font-semibold">
                                                    {formatDateTime(
                                                        deliveryWindowEnd,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Rental period
                                                </p>

                                                <p className="mt-1 text-sm font-semibold">
                                                    {
                                                        rentalDurationText
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Return deadline
                                                </p>

                                                <p className="mt-1 text-sm font-semibold">
                                                    {formatDateTime(
                                                        returnWindowEnd,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* -------------------------------------------------- */}
                        {/* STEP 4 */}
                        {/* -------------------------------------------------- */}

                        {currentStep === 4 && (
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <SectionHeader
                                    eyebrow="04 / Photos & Documents"
                                    title="Make the product easy to trust"
                                    description="Upload clear product photos and optional supporting documents."
                                />

                                <div className="space-y-7">
                                    {/* Images */}
                                    <div>
                                        <div className="mb-3 flex items-end justify-between gap-3">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-950">
                                                    Product photos
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    JPG, JPEG, PNG or WEBP.
                                                    Maximum 10 images and
                                                    5MB per file.
                                                </p>
                                            </div>

                                            <span className="shrink-0 text-xs font-bold text-slate-500">
                                                {
                                                    selectedImages.length
                                                }
                                                /10
                                            </span>
                                        </div>

                                        <label
                                            htmlFor="product-images"
                                            className="group flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/50"
                                        >
                                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm transition group-hover:text-blue-600">
                                                <Icon
                                                    name="image"
                                                    size={
                                                        23
                                                    }
                                                />
                                            </span>

                                            <span className="mt-4 text-sm font-bold text-slate-900">
                                                Add product photos
                                            </span>

                                            <span className="mt-1 text-xs text-slate-500">
                                                Click to browse your
                                                device
                                            </span>

                                            <input
                                                id="product-images"
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                                multiple
                                                onChange={
                                                    handleImageChange
                                                }
                                                className="sr-only"
                                            />
                                        </label>

                                        <FieldError
                                            message={
                                                errors.images
                                                    ?.message
                                            }
                                        />

                                        {selectedImages.length >
                                            0 && (
                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                {selectedImages.map(
                                                    (
                                                        image,
                                                        index,
                                                    ) => (
                                                        <div
                                                            key={`${image.name}-${image.size}-${image.lastModified}`}
                                                            className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                                                        >
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                                                <Icon
                                                                    name="image"
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                                    {
                                                                        image.name
                                                                    }
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-slate-400">
                                                                    {(
                                                                        image.size /
                                                                        1024 /
                                                                        1024
                                                                    ).toFixed(
                                                                        2,
                                                                    )}{" "}
                                                                    MB
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveImage(
                                                                        index,
                                                                    )
                                                                }
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                                aria-label={`Remove ${image.name}`}
                                                            >
                                                                <Icon
                                                                    name="x"
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Documents */}
                                    <div className="border-t border-slate-200 pt-7">
                                        <div className="mb-3 flex items-end justify-between gap-3">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-950">
                                                    Supporting documents
                                                    <span className="ml-2 text-xs font-medium text-slate-400">
                                                        Optional
                                                    </span>
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Product manuals,
                                                    warranty papers or
                                                    other relevant PDFs.
                                                    Maximum 5 documents.
                                                </p>
                                            </div>

                                            <span className="shrink-0 text-xs font-bold text-slate-500">
                                                {
                                                    selectedDocuments.length
                                                }
                                                /5
                                            </span>
                                        </div>

                                        <label
                                            htmlFor="product-documents"
                                            className="group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center transition hover:border-blue-400 hover:bg-blue-50/50"
                                        >
                                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition group-hover:text-blue-600">
                                                <Icon
                                                    name="file"
                                                    size={
                                                        21
                                                    }
                                                />
                                            </span>

                                            <span className="mt-3 text-sm font-bold text-slate-900">
                                                Add PDF documents
                                            </span>

                                            <span className="mt-1 text-xs text-slate-500">
                                                PDF files only
                                            </span>

                                            <input
                                                id="product-documents"
                                                type="file"
                                                accept=".pdf,application/pdf"
                                                multiple
                                                onChange={
                                                    handleDocumentChange
                                                }
                                                className="sr-only"
                                            />
                                        </label>

                                        <FieldError
                                            message={
                                                errors.documents
                                                    ?.message
                                            }
                                        />

                                        {selectedDocuments.length >
                                            0 && (
                                            <div className="mt-4 space-y-2">
                                                {selectedDocuments.map(
                                                    (
                                                        document,
                                                        index,
                                                    ) => (
                                                        <div
                                                            key={`${document.name}-${document.size}-${document.lastModified}`}
                                                            className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                                                        >
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                                                <Icon
                                                                    name="file"
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </div>

                                                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                                                                {
                                                                    document.name
                                                                }
                                                            </p>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveDocument(
                                                                        index,
                                                                    )
                                                                }
                                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                                aria-label={`Remove ${document.name}`}
                                                            >
                                                                <Icon
                                                                    name="x"
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* -------------------------------------------------- */}
                        {/* STEP 5 */}
                        {/* -------------------------------------------------- */}

                        {currentStep === 5 && (
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <SectionHeader
                                    eyebrow="05 / Pickup Location"
                                    title="Tell renters where the product starts"
                                    description="The pickup location helps the rider plan the handover and keeps the rental workflow accurate."
                                />

                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                                    <ProductLocationPicker
                                        value={
                                            productLocation
                                        }
                                        onChange={(
                                            location,
                                        ) => {
                                            setProductLocation(
                                                location,
                                            );

                                            setLocationError(
                                                "",
                                            );

                                            setIsLocationConfirmed(
                                                false,
                                            );
                                        }}
                                        onConfirmationChange={(
                                            confirmed,
                                        ) => {
                                            setIsLocationConfirmed(
                                                confirmed,
                                            );

                                            if (
                                                confirmed
                                            ) {
                                                setLocationError(
                                                    "",
                                                );
                                            }
                                        }}
                                    />
                                </div>

                                {locationError && (
                                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                                        <p
                                            role="alert"
                                            className="text-sm font-medium text-red-700"
                                        >
                                            {
                                                locationError
                                            }
                                        </p>
                                    </div>
                                )}

                                {isLocationConfirmed && (
                                    <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                                <Icon
                                                    name="check"
                                                    size={
                                                        17
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-emerald-950">
                                                    Pickup location
                                                    confirmed
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-emerald-800">
                                                    The confirmed location
                                                    will be submitted with
                                                    your product listing.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* -------------------------------------------------- */}
                        {/* STEP 6 */}
                        {/* -------------------------------------------------- */}

                        {currentStep === 6 && (
                            <section className="space-y-5">
                                <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                                        06 / Review & Publish
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold tracking-tight">
                                        Everything looks ready
                                    </h2>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                                        Review your listing details before
                                        sending it to the ToolShare product
                                        workflow.
                                    </p>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                                <Icon
                                                    name="package"
                                                    size={
                                                        19
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                    Product
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-950">
                                                    {name ||
                                                        "Not set"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                                            <div className="flex justify-between gap-4 text-sm">
                                                <span className="text-slate-500">
                                                    Category
                                                </span>

                                                <span className="font-semibold text-slate-800">
                                                    {selectedCategory?.name ??
                                                        "Not selected"}
                                                </span>
                                            </div>

                                            <div className="flex justify-between gap-4 text-sm">
                                                <span className="text-slate-500">
                                                    Daily price
                                                </span>

                                                <span className="font-semibold text-slate-800">
                                                    ৳
                                                    {formatMoney(
                                                        pricePerDay,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex justify-between gap-4 text-sm">
                                                <span className="text-slate-500">
                                                    Photos
                                                </span>

                                                <span className="font-semibold text-slate-800">
                                                    {
                                                        selectedImages.length
                                                    }
                                                    /10
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                                <Icon
                                                    name="calendar"
                                                    size={
                                                        19
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                    Rental period
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-950">
                                                    {
                                                        rentalDurationText
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Rental starts
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                    {formatDateTime(
                                                        rentalWindowStart,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Rental ends
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                    {formatDateTime(
                                                        rentalWindowEnd,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                                <Icon
                                                    name="package"
                                                    size={
                                                        19
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                    Rider pickup
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-950">
                                                    Pickup window
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Earliest pickup
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                    {formatDateTime(
                                                        deliveryWindowStart,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Pickup deadline
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                    {formatDateTime(
                                                        deliveryWindowEnd,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                                                <Icon
                                                    name="location"
                                                    size={
                                                        19
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                    Pickup location
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-950">
                                                    {isLocationConfirmed
                                                        ? "Confirmed"
                                                        : "Not confirmed"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 border-t border-slate-100 pt-4">
                                            <p className="text-sm leading-6 text-slate-600">
                                                {productLocation.pickupAddress ||
                                                    "No pickup address selected."}
                                            </p>

                                            {productLocation.district && (
                                                <p className="mt-2 text-xs font-medium text-slate-400">
                                                    {
                                                        productLocation.upazila
                                                    }
                                                    ,{" "}
                                                    {
                                                        productLocation.district
                                                    }
                                                    ,{" "}
                                                    {
                                                        productLocation.division
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Rental rules
                                    </p>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Rental range
                                            </p>

                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {
                                                    minRentalDays
                                                }{" "}
                                                –{" "}
                                                {
                                                    maxRentalDays
                                                }{" "}
                                                days
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Negotiation
                                            </p>

                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {negotiationAllowed
                                                    ? "Allowed"
                                                    : "Fixed price"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Same-day
                                            </p>

                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {allowSameDayRental
                                                    ? "Allowed"
                                                    : "Not allowed"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                                            <Icon
                                                name="shield"
                                                size={
                                                    17
                                                }
                                            />
                                        </div>

                                        <div>
                                            <p className="text-sm font-bold text-blue-950">
                                                Ready to publish
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-blue-800">
                                                Your product will be sent
                                                through the existing
                                                ToolShare backend workflow
                                                with the selected images,
                                                documents, schedule and
                                                pickup location.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* -------------------------------------------------- */}
                        {/* Bottom actions                                      */}
                        {/* -------------------------------------------------- */}

                        <div className="mt-6 flex flex-col-reverse gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/products/my-products"
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </Link>

                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={
                                            goBack
                                        }
                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <Icon
                                            name="arrow-left"
                                            size={
                                                16
                                            }
                                        />

                                        Back
                                    </button>
                                )}
                            </div>

                            {currentStep <
                            TOTAL_STEPS ? (
                                <button
                                    type="button"
                                    onClick={
                                        goNext
                                    }
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Continue

                                    <Icon
                                        name="arrow-right"
                                        size={
                                            17
                                        }
                                    />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        !isLocationConfirmed
                                    }
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            Publish product

                                            <Icon
                                                name="check"
                                                size={
                                                    17
                                                }
                                            />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>

                    {/* ------------------------------------------------------ */}
                    {/* Desktop live preview                                    */}
                    {/* ------------------------------------------------------ */}

                    <aside className="hidden lg:block">
                        <div className="sticky top-24 space-y-4">
                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                                <div className="bg-slate-950 px-5 py-4 text-white">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                                        Live preview
                                    </p>

                                    <p className="mt-1 text-sm font-bold">
                                        How renters will understand
                                        your listing
                                    </p>
                                </div>

                                <div className="p-5">
                                    <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                                        {selectedImages.length >
                                        0 ? (
                                            <div className="text-center">
                                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                                                    <Icon
                                                        name="image"
                                                        size={
                                                            22
                                                        }
                                                    />
                                                </div>

                                                <p className="mt-3 text-xs font-semibold text-slate-500">
                                                    {
                                                        selectedImages.length
                                                    }{" "}
                                                    photo
                                                    {selectedImages.length !==
                                                    1
                                                        ? "s"
                                                        : ""}{" "}
                                                    selected
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                                                    <Icon
                                                        name="package"
                                                        size={
                                                            22
                                                        }
                                                    />
                                                </div>

                                                <p className="mt-3 text-xs font-medium text-slate-400">
                                                    Product preview
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5">
                                        <p className="text-lg font-bold tracking-tight text-slate-950">
                                            {name ||
                                                "Your product name"}
                                        </p>

                                        <p className="mt-1 text-xs font-medium text-slate-400">
                                            {selectedCategory?.name ??
                                                "Product category"}
                                        </p>

                                        <div className="mt-4 flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-slate-950">
                                                ৳
                                                {formatMoney(
                                                    pricePerDay,
                                                )}
                                            </span>

                                            <span className="text-xs text-slate-400">
                                                / day
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-slate-400">
                                                Rental period
                                            </span>

                                            <span className="text-xs font-bold text-slate-800">
                                                {
                                                    rentalDurationText
                                                }
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-slate-400">
                                                Negotiation
                                            </span>

                                            <span className="text-xs font-bold text-slate-800">
                                                {negotiationAllowed
                                                    ? "Available"
                                                    : "Fixed"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-slate-400">
                                                Pickup
                                            </span>

                                            <span className="text-right text-xs font-bold text-slate-800">
                                                {productLocation.district ||
                                                    "Not set"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Listing checklist
                                </p>

                                <div className="mt-4 space-y-3">
                                    {[
                                        {
                                            label: "Product information",
                                            done:
                                                Boolean(
                                                    name &&
                                                        description &&
                                                        categoryId,
                                                ),
                                        },
                                        {
                                            label: "Pricing & rules",
                                            done:
                                                Boolean(
                                                    pricePerDay &&
                                                        minRentalDays <=
                                                            maxRentalDays,
                                                ),
                                        },
                                        {
                                            label: "Rental schedule",
                                            done:
                                                Boolean(
                                                    rentalWindowStart &&
                                                        rentalWindowEnd,
                                                ),
                                        },
                                        {
                                            label: "Product photos",
                                            done:
                                                selectedImages.length >
                                                0,
                                        },
                                        {
                                            label: "Pickup location",
                                            done:
                                                isLocationConfirmed,
                                        },
                                    ].map(
                                        (
                                            item,
                                        ) => (
                                            <div
                                                key={
                                                    item.label
                                                }
                                                className="flex items-center gap-3"
                                            >
                                                <span
                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                                        item.done
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-slate-100 text-slate-400"
                                                    }`}
                                                >
                                                    <Icon
                                                        name="check"
                                                        size={
                                                            13
                                                        }
                                                    />
                                                </span>

                                                <span
                                                    className={`text-xs font-semibold ${
                                                        item.done
                                                            ? "text-slate-800"
                                                            : "text-slate-400"
                                                    }`}
                                                >
                                                    {
                                                        item.label
                                                    }
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </>
    );
}