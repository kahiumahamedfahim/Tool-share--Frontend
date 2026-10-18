"use client";

import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
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

    }, [category]);

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
        */

        const apiBaseUrl =
            process.env.NEXT_PUBLIC_API_URL;

        const updateUrl =
            `${apiBaseUrl}/categories/${category.categoryId}`;

        console.log("=================================");
        console.log("EDIT CATEGORY");
        console.log("Category ID:", category.categoryId);
        console.log("API URL:", apiBaseUrl);
        console.log("Update URL:", updateUrl);
        console.log("=================================");

        try {

            setUpdating(true);

            const response = await axios.patch(
                updateUrl,
                {
                    name: validationResult.data.name,
                    description:
                        validationResult.data.description,

                    status:
                        validationResult.data.status,
                },
                {
                    withCredentials: true,
                }
            );

            console.log(
                "Category updated successfully:",
                response.data
            );

            /*
            |--------------------------------------------------------------------------
            | Success
            |--------------------------------------------------------------------------
            */

            onClose();

            onSuccess();

        } catch (error: unknown) {

            console.error(
                "Category update failed:",
                error
            );

            if (axios.isAxiosError(error)) {

                console.log(
                    "Status:",
                    error.response?.status
                );

                console.log(
                    "Response:",
                    error.response?.data
                );

                console.log(
                    "Request URL:",
                    error.config?.url
                );

                console.log(
                    "Request Method:",
                    error.config?.method
                );

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