"use client";

import { isAxiosError } from "axios";
import api from "@/app/lib/axios";
import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useState,
} from "react";
import { z } from "zod";

interface Category {
    id: number;
    categoryId: string;
    name: string;
    description: string;
    image: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface EditCategoryProps {
    open: boolean;
    category: Category | null;
    onClose: () => void;
    onSuccess: () => void;
}

const editCategorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Category name is required")
        .max(100, "Category name cannot exceed 100 characters"),

    description: z
        .string()
        .optional(),

    status: z.enum(["ACTIVE", "INACTIVE"]),
});

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:7000";

export default function EditCategory({
    open,
    category,
    onClose,
    onSuccess,
}: EditCategoryProps) {

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

    const [updating, setUpdating] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [newImage, setNewImage] =
        useState<File | null>(null);

    const [newImagePreview, setNewImagePreview] =
        useState<string | null>(null);

    /*
    |--------------------------------------------------------------------------
    | Load Category
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (!category) {
            return;
        }

        setName(category.name);
        setDescription(category.description || "");

        setStatus(
            category.status === "INACTIVE"
                ? "INACTIVE"
                : "ACTIVE"
        );

        setErrorMessage("");
        setNewImage(null);
        setNewImagePreview(null);

    }, [category]);

    /*
    |--------------------------------------------------------------------------
    | Image Handling
    |--------------------------------------------------------------------------
    */

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const selectedFile = event.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(selectedFile.type)) {
            setErrorMessage(
                "Only JPG, JPEG, PNG and WEBP images are allowed.",
            );

            event.target.value = "";

            return;
        }

        const maxSize = 2 * 1024 * 1024;

        if (selectedFile.size > maxSize) {
            setErrorMessage(
                "Image size cannot exceed 2 MB.",
            );

            event.target.value = "";

            return;
        }

        setErrorMessage("");
        setNewImage(selectedFile);

        setNewImagePreview(
            URL.createObjectURL(selectedFile),
        );
    };

    const removeNewImage = () => {
        setNewImage(null);
        setNewImagePreview(null);
    };

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        if (!category) {
            return;
        }

        setErrorMessage("");

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        const validationResult =
            editCategorySchema.safeParse({
                name,
                description,
                status,
            });

        if (!validationResult.success) {

            setErrorMessage(
                validationResult.error.issues[0]?.message ||
                "Please check the form."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | API
        |--------------------------------------------------------------------------
        |
        | The update is always sent as multipart/form-data
        | so that an optional new image can be attached.
        |
        */

        try {

            setUpdating(true);

            const formData = new FormData();

            formData.append(
                "name",
                validationResult.data.name,
            );

            formData.append(
                "description",
                validationResult.data.description ?? "",
            );

            formData.append(
                "status",
                validationResult.data.status,
            );

            if (newImage) {
                formData.append(
                    "image",
                    newImage,
                );
            }

            await api.patch(
                `/categories/${category.categoryId}`,
                formData,
            );

            /*
            |--------------------------------------------------------------------------
            | Success
            |--------------------------------------------------------------------------
            */

            onClose();

            onSuccess();

        } catch (error: unknown) {

            if (isAxiosError(error)) {

                const backendMessage =
                    error.response?.data?.message;

                if (Array.isArray(backendMessage)) {

                    setErrorMessage(
                        backendMessage.join(", ")
                    );

                } else {

                    setErrorMessage(
                        backendMessage ||
                        "Failed to update category."
                    );
                }

            } else {

                setErrorMessage(
                    "Something went wrong. Please try again."
                );
            }

        } finally {

            setUpdating(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Close
    |--------------------------------------------------------------------------
    */

    const handleClose = () => {

        if (updating) {
            return;
        }

        setErrorMessage("");

        onClose();
    };

    /*
    |--------------------------------------------------------------------------
    | Current Preview Image
    |--------------------------------------------------------------------------
    */

    const previewImage = newImagePreview
        ? newImagePreview
        : category?.image
          ? `${API_BASE_URL}/uploads/category/${encodeURIComponent(
                category.image
            )}`
          : null;

    /*
    |--------------------------------------------------------------------------
    | Modal
    |--------------------------------------------------------------------------
    */

    if (!open || !category) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* Header */}

                <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">

                    <div>

                        <h2 className="text-xl font-bold text-zinc-900">
                            Edit Category
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            Update category information
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={updating}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        ×
                    </button>

                </div>

                {/* Form */}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 p-6"
                >

                    {/* Error */}

                    {errorMessage && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">

                            <p className="text-sm font-medium text-red-600">
                                {errorMessage}
                            </p>

                        </div>
                    )}

                    {/* Category ID */}

                    <div>

                        <label
                            htmlFor="categoryId"
                            className="mb-2 block text-sm font-medium text-zinc-700"
                        >
                            Category ID
                        </label>

                        <input
                            id="categoryId"
                            type="text"
                            value={category.categoryId}
                            disabled
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-500 outline-none"
                        />

                    </div>

                    {/* Category Name */}

                    <div>

                        <label
                            htmlFor="categoryName"
                            className="mb-2 block text-sm font-medium text-zinc-700"
                        >
                            Category Name
                            <span className="text-red-500">
                                {" "}*
                            </span>
                        </label>

                        <input
                            id="categoryName"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            disabled={updating}
                            maxLength={100}
                            placeholder="Enter category name"
                            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-zinc-100"
                        />

                        <div className="mt-1 text-right text-xs text-zinc-400">
                            {name.length}/100
                        </div>

                    </div>

                    {/* Description */}

                    <div>

                        <label
                            htmlFor="categoryDescription"
                            className="mb-2 block text-sm font-medium text-zinc-700"
                        >
                            Description
                        </label>

                        <textarea
                            id="categoryDescription"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            disabled={updating}
                            rows={4}
                            placeholder="Enter category description"
                            className="w-full resize-none rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-zinc-100"
                        />

                    </div>

                    {/* Status */}

                    <div>

                        <label
                            htmlFor="categoryStatus"
                            className="mb-2 block text-sm font-medium text-zinc-700"
                        >
                            Status
                        </label>

                        <select
                            id="categoryStatus"
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value as
                                        | "ACTIVE"
                                        | "INACTIVE"
                                )
                            }
                            disabled={updating}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-zinc-100"
                        >

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="INACTIVE">
                                Inactive
                            </option>

                        </select>

                    </div>

                    {/* Image */}

                    <div>

                        <label className="mb-2 block text-sm font-medium text-zinc-700">
                            Category Image
                        </label>

                        {previewImage ? (

                            <div className="relative overflow-hidden rounded-xl border border-zinc-200">

                                <img
                                    src={previewImage}
                                    alt="Category preview"
                                    className="h-40 w-full object-cover"
                                />

                                {newImagePreview && (
                                    <button
                                        type="button"
                                        onClick={removeNewImage}
                                        disabled={updating}
                                        className="absolute right-3 top-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/80 disabled:opacity-50"
                                    >
                                        Undo
                                    </button>
                                )}

                            </div>

                        ) : (
                            <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
                                No image
                            </div>
                        )}

                        <label
                            htmlFor="category-image"
                            className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                        >
                            {newImage
                                ? "Replace image"
                                : "Upload new image"}

                            <input
                                id="category-image"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                onChange={
                                    handleImageChange
                                }
                                disabled={updating}
                                className="hidden"
                            />
                        </label>

                        <p className="mt-1 text-xs text-zinc-400">
                            JPG, PNG or WEBP • Maximum 2 MB
                        </p>

                    </div>

                    {/* Buttons */}

                    <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={updating}
                            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={updating}
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {updating
                                ? "Updating..."
                                : "Update Category"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}
