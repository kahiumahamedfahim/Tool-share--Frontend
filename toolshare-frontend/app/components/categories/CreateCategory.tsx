"use client";

import api from "@/app/lib/axios";
import { ChangeEvent, FormEvent, useState } from "react";
import { z } from "zod";

interface CreateCategoryProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const createCategorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Category name is required")
        .max(100, "Category name cannot exceed 100 characters"),

    description: z
        .string()
        .optional(),
});

export default function CreateCategory({
    open,
    onClose,
    onSuccess,
}: CreateCategoryProps) {
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formError, setFormError] = useState<string>("");
    const [creating, setCreating] = useState<boolean>(false);

    if (!open) {
        return null;
    }

    const resetForm = () => {
        setName("");
        setDescription("");
        setImage(null);
        setImagePreview(null);
        setFormError("");
    };

    const handleClose = () => {
        if (creating) {
            return;
        }

        resetForm();
        onClose();
    };

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
            setFormError(
                "Only JPG, JPEG, PNG and WEBP images are allowed.",
            );

            event.target.value = "";

            return;
        }

        const maxSize = 2 * 1024 * 1024;

        if (selectedFile.size > maxSize) {
            setFormError(
                "Image size cannot exceed 2 MB.",
            );

            event.target.value = "";

            return;
        }

        setFormError("");
        setImage(selectedFile);

        const previewUrl = URL.createObjectURL(selectedFile);

        setImagePreview(previewUrl);
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setFormError("");

        const validationResult =
            createCategorySchema.safeParse({
                name,
                description,
            });

        if (!validationResult.success) {
            setFormError(
                validationResult.error.issues[0]?.message ||
                "Please check the form.",
            );

            return;
        }

        try {
            setCreating(true);

            const formData = new FormData();

            formData.append(
                "name",
                validationResult.data.name,
            );

            if (validationResult.data.description) {
                formData.append(
                    "description",
                    validationResult.data.description,
                );
            }

            if (image) {
                formData.append("image", image);
            }

           await api.post(
    "/categories/create",
    formData,
);

            resetForm();

            onClose();

            onSuccess();
        }
        catch (error: any) {
            console.error(
                "Failed to create category:",
                error,
            );

            const backendMessage =
                error?.response?.data?.message;

            if (Array.isArray(backendMessage)) {
                setFormError(
                    backendMessage.join(", "),
                );
            }
            else {
                setFormError(
                    backendMessage ||
                    "Failed to create category.",
                );
            }
        }
        finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">

            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">

                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900">
                            Create Category
                        </h2>

                        <p className="mt-1 text-xs text-zinc-500">
                            Add a new category to ToolShare
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={creating}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        ×
                    </button>

                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>

                    <div className="space-y-5 px-6 py-6">

                        {/* Error */}
                        {formError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                                <p className="text-sm text-red-600">
                                    {formError}
                                </p>
                            </div>
                        )}

                        {/* Name */}
                        <div>

                            <label
                                htmlFor="category-name"
                                className="mb-1.5 block text-sm font-medium text-zinc-700"
                            >
                                Category Name
                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="category-name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value,
                                    )
                                }
                                placeholder="e.g. Power Tools"
                                maxLength={100}
                                disabled={creating}
                                className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-zinc-100"
                            />

                            <div className="mt-1 flex justify-end">
                                <span className="text-xs text-zinc-400">
                                    {name.length}/100
                                </span>
                            </div>

                        </div>

                        {/* Description */}
                        <div>

                            <label
                                htmlFor="category-description"
                                className="mb-1.5 block text-sm font-medium text-zinc-700"
                            >
                                Description
                            </label>

                            <textarea
                                id="category-description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="Describe this category..."
                                rows={4}
                                disabled={creating}
                                className="w-full resize-none rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-zinc-100"
                            />

                        </div>

                        {/* Image */}
                        <div>

                            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                                Category Image
                            </label>

                            {!imagePreview ? (

                                <label
                                    htmlFor="category-image"
                                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
                                >

                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl">
                                        🖼️
                                    </div>

                                    <p className="mt-3 text-sm font-medium text-zinc-700">
                                        Click to upload
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-400">
                                        JPG, PNG or WEBP • Maximum 2 MB
                                    </p>

                                    <input
                                        id="category-image"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                        onChange={
                                            handleImageChange
                                        }
                                        disabled={creating}
                                        className="hidden"
                                    />

                                </label>

                            ) : (

                                <div className="relative overflow-hidden rounded-xl border border-zinc-200">

                                    <img
                                        src={imagePreview}
                                        alt="Category preview"
                                        className="h-48 w-full object-cover"
                                    />

                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        disabled={creating}
                                        className="absolute right-3 top-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/80 disabled:opacity-50"
                                    >
                                        Remove
                                    </button>

                                </div>

                            )}

                        </div>

                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50 px-6 py-4">

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={creating}
                            className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={creating}
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {creating
                                ? "Creating..."
                                : "Create Category"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}