"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import ProductLocationPicker, {
    type ProductLocationData,
} from "@/app/products/ProductLocationPicker";
import {
    createProductSchema,
    type CreateProductFormData,
    type CreateProductFormInput,
} from "@/schemas/products/productSchema";

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

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:7000";

export default function CreateProductPage() {
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState("");
    const [categoryRetry, setCategoryRetry] = useState(0);
    const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
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
        },
    });

    const negotiationAllowed = watch("negotiationAllowed");
    const allowSameDayRental = watch("allowSameDayRental");

    const { ref: nameRef, ...nameField } = register("name");
    const { ref: descriptionRef, ...descriptionField } = register("description");
    const { ref: categoryRef, ...categoryField } = register("categoryId");
    const { ref: priceRef, ...priceField } = register("pricePerDay");

    useEffect(() => {
        let isMounted = true;

        const fetchCategories = async () => {
            try {
                setIsLoadingCategories(true);
                setCategoryError("");

                const response = await axios.get<CategoryResponse>(
                    `${API_BASE_URL}/categories`,
                    {
                        params: { page: 1, limit: 100 },
                        withCredentials: true,
                    },
                );

                if (isMounted) {
                    setCategories(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                if (isMounted) {
                    setCategoryError("Failed to load categories. Please try again.");
                }
            } finally {
                if (isMounted) {
                    setIsLoadingCategories(false);
                }
            }
        };

        void fetchCategories();
        return () => {
            isMounted = false;
        };
    }, [categoryRetry]);

    const onSubmit = async (data: CreateProductFormData) => {
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
            return;
        }

        setLocationError("");

        const formData = new FormData();
        formData.append("name", data.name.trim());
        formData.append("description", data.description.trim());
        formData.append("categoryId", data.categoryId);
        formData.append("pricePerDay", String(Number(data.pricePerDay)));
        formData.append("negotiationAllowed", String(data.negotiationAllowed));
        formData.append("minRentalDays", String(data.minRentalDays));
        formData.append("maxRentalDays", String(data.maxRentalDays));
        formData.append(
            "preparationBufferDays",
            String(data.preparationBufferDays),
        );
        formData.append("allowSameDayRental", String(data.allowSameDayRental));

        formData.append("latitude", String(productLocation.latitude));
        formData.append("longitude", String(productLocation.longitude));
        formData.append("division", productLocation.division.trim());
        formData.append("district", productLocation.district.trim());
        formData.append("upazila", productLocation.upazila.trim());
        formData.append("pickupAddress", productLocation.pickupAddress.trim());

        data.images.forEach((image) => formData.append("productImages", image));
        data.documents.forEach((document) =>
            formData.append("productDocuments", document),
        );

        try {
            const response = await axios.post(
                `${API_BASE_URL}/products/createProduct`,
                formData,
                { withCredentials: true },
            );

            console.log("Product created successfully:", response.data);
            window.alert("Product created successfully!");
            window.location.href = "/products/my-products";
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(
                    "Product creation failed:",
                    error.response?.data ?? error.message,
                );
                const message = error.response?.data?.message;
                window.alert(
                    Array.isArray(message)
                        ? message.join("\n")
                        : message ??
                              "Failed to create product. Please check your inputs and try again.",
                );
            } else {
                console.error("Unexpected error:", error);
                window.alert("An unexpected error occurred.");
            }
        }
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(event.target.files ?? []);
        if (newFiles.length === 0) return;

        const uniqueNewFiles = newFiles.filter(
            (newFile) =>
                !selectedImages.some(
                    (existingFile) =>
                        existingFile.name === newFile.name &&
                        existingFile.size === newFile.size &&
                        existingFile.lastModified === newFile.lastModified,
                ),
        );
        const combinedImages = [...selectedImages, ...uniqueNewFiles];

        setSelectedImages(combinedImages);
        setValue("images", combinedImages, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        event.target.value = "";
    };

    const handleRemoveImage = (indexToRemove: number) => {
        const updatedImages = selectedImages.filter(
            (_, index) => index !== indexToRemove,
        );
        setSelectedImages(updatedImages);
        setValue("images", updatedImages, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
    };

    const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(event.target.files ?? []);
        if (newFiles.length === 0) return;

        const uniqueNewFiles = newFiles.filter(
            (newFile) =>
                !selectedDocuments.some(
                    (existingFile) =>
                        existingFile.name === newFile.name &&
                        existingFile.size === newFile.size &&
                        existingFile.lastModified === newFile.lastModified,
                ),
        );
        const combinedDocuments = [...selectedDocuments, ...uniqueNewFiles];

        setSelectedDocuments(combinedDocuments);
        setValue("documents", combinedDocuments, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        event.target.value = "";
    };

    const handleRemoveDocument = (indexToRemove: number) => {
        const updatedDocuments = selectedDocuments.filter(
            (_, index) => index !== indexToRemove,
        );
        setSelectedDocuments(updatedDocuments);
        setValue("documents", updatedDocuments, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
    };

    return (
        <>
            <RoleBasedNavbar />

            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-5xl">
                    <div className="mb-8">
                        <Link
                            href="/products/my-products"
                            className="text-sm font-medium text-blue-700 hover:text-blue-800"
                        >
                            ← Back to My Products
                        </Link>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                            Upload a Product
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Share your tools with others by providing accurate product
                            information and rental policies.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
                        {/* Basic Information */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Provide the product name and description.
                            </p>

                            <div className="mt-6 space-y-5">
                                <div>
                                    <label htmlFor="product-name" className="mb-2 block text-sm font-medium text-slate-700">
                                        Product Name *
                                    </label>
                                    <input
                                        {...nameField}
                                        ref={nameRef}
                                        id="product-name"
                                        type="text"
                                        maxLength={150}
                                        placeholder="e.g. Bosch Electric Drill"
                                        aria-invalid={Boolean(errors.name)}
                                        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`}
                                    />
                                    {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
                                    <p className="mt-1 text-xs text-slate-500">Maximum 150 characters.</p>
                                </div>

                                <div>
                                    <label htmlFor="product-description" className="mb-2 block text-sm font-medium text-slate-700">
                                        Description *
                                    </label>
                                    <textarea
                                        {...descriptionField}
                                        ref={descriptionRef}
                                        id="product-description"
                                        rows={5}
                                        placeholder="Describe the product, its condition, features and usage..."
                                        aria-invalid={Boolean(errors.description)}
                                        className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${errors.description ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`}
                                    />
                                    {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Category and Pricing */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="text-lg font-semibold text-slate-900">Category and Pricing</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Choose the correct category and set your daily rental price.
                            </p>

                            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="category-id" className="mb-2 block text-sm font-medium text-slate-700">
                                        Product Category *
                                    </label>
                                    <select
                                        {...categoryField}
                                        ref={categoryRef}
                                        id="category-id"
                                        disabled={isLoadingCategories || categories.length === 0}
                                        aria-invalid={Boolean(errors.categoryId)}
                                        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 ${errors.categoryId ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`}
                                    >
                                        <option value="">
                                            {isLoadingCategories ? "Loading categories..." : categories.length === 0 ? "No categories available" : "Select a category"}
                                        </option>
                                        {categories.map((category) => (
                                            <option key={category.categoryId} value={category.categoryId}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.categoryId && <p className="mt-2 text-sm text-red-600">{errors.categoryId.message}</p>}
                                    {categoryError && (
                                        <div className="mt-2">
                                            <p className="text-sm text-red-600">{categoryError}</p>
                                            <button type="button" onClick={() => setCategoryRetry((count) => count + 1)} className="mt-1 text-sm font-medium text-blue-700 hover:underline">
                                                Retry
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="price-per-day" className="mb-2 block text-sm font-medium text-slate-700">
                                        Rental Price per Day (৳) *
                                    </label>
                                    <input
                                        {...priceField}
                                        ref={priceRef}
                                        id="price-per-day"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="e.g. 500"
                                        aria-invalid={Boolean(errors.pricePerDay)}
                                        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${errors.pricePerDay ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`}
                                    />
                                    {errors.pricePerDay && <p className="mt-2 text-sm text-red-600">{errors.pricePerDay.message}</p>}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Allow Price Negotiation</p>
                                    <p className="mt-1 text-sm text-slate-500">Let renters negotiate the rental price.</p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-label="Allow price negotiation"
                                    aria-checked={negotiationAllowed}
                                    onClick={() => setValue("negotiationAllowed", !negotiationAllowed, { shouldDirty: true, shouldValidate: true })}
                                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${negotiationAllowed ? "bg-blue-600" : "bg-slate-300"}`}
                                >
                                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${negotiationAllowed ? "left-5" : "left-0.5"}`} />
                                </button>
                            </div>
                        </section>

                        {/* Rental Policy */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="text-lg font-semibold text-slate-900">Rental Policy</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Set rental duration limits and the preparation time you need between rentals.
                            </p>

                            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="min-rental-days" className="mb-2 block text-sm font-medium text-slate-700">Minimum Rental Duration (days) *</label>
                                    <input id="min-rental-days" type="number" min={1} max={30} step={1} {...register("minRentalDays", { valueAsNumber: true })} aria-invalid={Boolean(errors.minRentalDays)} className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 ${errors.minRentalDays ? "border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />
                                    {errors.minRentalDays && <p className="mt-2 text-sm text-red-600">{errors.minRentalDays.message}</p>}
                                    <p className="mt-1 text-xs text-slate-500">Minimum 1 day; maximum 30 days.</p>
                                </div>

                                <div>
                                    <label htmlFor="max-rental-days" className="mb-2 block text-sm font-medium text-slate-700">Maximum Rental Duration (days) *</label>
                                    <input id="max-rental-days" type="number" min={1} max={30} step={1} {...register("maxRentalDays", { valueAsNumber: true })} aria-invalid={Boolean(errors.maxRentalDays)} className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 ${errors.maxRentalDays ? "border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />
                                    {errors.maxRentalDays && <p className="mt-2 text-sm text-red-600">{errors.maxRentalDays.message}</p>}
                                    <p className="mt-1 text-xs text-slate-500">Must be at least the minimum rental duration.</p>
                                </div>

                                <div>
                                    <label htmlFor="preparation-buffer-days" className="mb-2 block text-sm font-medium text-slate-700">Preparation Buffer (days) *</label>
                                    <input id="preparation-buffer-days" type="number" min={0} max={30} step={1} {...register("preparationBufferDays", { valueAsNumber: true })} aria-invalid={Boolean(errors.preparationBufferDays)} className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 ${errors.preparationBufferDays ? "border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"}`} />
                                    {errors.preparationBufferDays && <p className="mt-2 text-sm text-red-600">{errors.preparationBufferDays.message}</p>}
                                    <p className="mt-1 text-xs text-slate-500">Use 0 if no preparation gap is needed.</p>
                                </div>

                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Allow Same-Day Rental</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">Permit rentals starting today when availability allows.</p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-label="Allow same-day rental"
                                            aria-checked={allowSameDayRental}
                                            onClick={() => setValue("allowSameDayRental", !allowSameDayRental, { shouldDirty: true, shouldValidate: true })}
                                            className={`relative h-6 w-11 shrink-0 rounded-full transition ${allowSameDayRental ? "bg-blue-600" : "bg-slate-300"}`}
                                        >
                                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${allowSameDayRental ? "left-5" : "left-0.5"}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                                <p className="text-sm leading-6 text-blue-900">
                                    <strong>Important:</strong> Renters must choose a duration within your limits. The backend must validate availability and preparation gaps before confirming a rental.
                                </p>
                            </div>
                        </section>

                        {/* Product Images */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="text-lg font-semibold text-slate-900">Product Images *</h2>
                            <p className="mt-1 text-sm text-slate-500">Upload at least one clear image. JPG, PNG or WEBP; maximum 2 MB per image and 10 images total.</p>

                            <label htmlFor="product-images" className="mt-5 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/50">
                                <span className="text-3xl" aria-hidden="true">🖼️</span>
                                <span className="mt-3 text-sm font-semibold text-slate-800">Choose product images</span>
                                <span className="mt-1 text-xs text-slate-500">JPG, JPEG, PNG or WEBP</span>
                                <input id="product-images" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple onChange={handleImageChange} className="sr-only" />
                            </label>

                            {errors.images && <p className="mt-3 text-sm text-red-600">{errors.images.message}</p>}
                            {selectedImages.length > 0 && (
                                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                                    <p className="text-sm font-semibold text-blue-900">{selectedImages.length} image(s) selected</p>
                                    <ul className="mt-3 space-y-2">
                                        {selectedImages.map((image, index) => (
                                            <li key={`${image.name}-${image.size}-${image.lastModified}`} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3">
                                                <span className="min-w-0 truncate text-sm text-slate-700">{image.name}</span>
                                                <button type="button" onClick={() => handleRemoveImage(index)} className="shrink-0 text-sm font-medium text-red-600 hover:text-red-800">Remove</button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>

                        {/* Optional Documents */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="text-lg font-semibold text-slate-900">Supporting Documents <span className="ml-2 text-xs font-normal text-slate-400">Optional</span></h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">Attach a product manual, warranty document or another relevant PDF. Maximum 5 documents.</p>

                            <label htmlFor="product-documents" className="mt-5 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/50">
                                <span className="text-3xl" aria-hidden="true">📄</span>
                                <span className="mt-3 text-sm font-semibold text-slate-800">Choose PDF documents</span>
                                <span className="mt-1 text-xs text-slate-500">PDF files only</span>
                                <input id="product-documents" type="file" accept=".pdf,application/pdf" multiple onChange={handleDocumentChange} className="sr-only" />
                            </label>

                            {errors.documents && <p className="mt-3 text-sm text-red-600">{errors.documents.message}</p>}
                            {selectedDocuments.length > 0 && (
                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-800">{selectedDocuments.length} document(s) selected</p>
                                    <ul className="mt-3 space-y-2">
                                        {selectedDocuments.map((document, index) => (
                                            <li key={`${document.name}-${document.size}-${document.lastModified}`} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3">
                                                <span className="min-w-0 truncate text-sm text-slate-700">{document.name}</span>
                                                <button type="button" onClick={() => handleRemoveDocument(index)} className="shrink-0 text-sm font-medium text-red-600 hover:text-red-800">Remove</button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>

                        {/* Product Pickup Location */}
                        <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                            <h2 className="mb-2 text-lg font-semibold text-slate-900">Product Pickup Location *</h2>
                            <p className="mb-5 text-sm leading-6 text-slate-500">Select the product&apos;s pickup location and confirm it before submitting.</p>

                            <ProductLocationPicker
                                value={productLocation}
                                onChange={(location) => {
                                    setProductLocation(location);
                                    setLocationError("");
                                }}
                                onConfirmationChange={(confirmed) => {
                                    setIsLocationConfirmed(confirmed);
                                    if (!confirmed) setLocationError("");
                                }}
                            />
                            {locationError && <p role="alert" className="mt-3 text-sm text-red-600">{locationError}</p>}
                        </section>

                        {/* Actions */}
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Link href="/products/my-products" className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                                Cancel
                            </Link>
                            <button type="submit" disabled={isSubmitting || !isLocationConfirmed} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300">
                                {isSubmitting ? "Uploading Product..." : "Create Product"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
