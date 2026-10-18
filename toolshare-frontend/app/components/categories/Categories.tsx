"use client";

import axios from "axios";
import { useEffect, useState } from "react";

import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import CreateCategory from "@/app/components/categories/CreateCategory";
import EditCategory from "@/app/components/categories/EditCategory";
import Loading from "@/app/components/Loading";
import ErrorMessage from "@/app/components/ErrorMessage";

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

type UserRole =
    | "ADMIN"
    | "MODERATOR"
    | "RIDER"
    | "USER"
    | null;

export default function Categories() {
    /*
    |--------------------------------------------------------------------------
    | API
    |--------------------------------------------------------------------------
    */

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL;

    /*
    |--------------------------------------------------------------------------
    | Categories
    |--------------------------------------------------------------------------
    */

    const [categories, setCategories] =
        useState<Category[]>([]);

    /*
    |--------------------------------------------------------------------------
    | User Role
    |--------------------------------------------------------------------------
    */

    const [userRole, setUserRole] =
        useState<UserRole>(null);

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | Error
    |--------------------------------------------------------------------------
    */

    const [error, setError] =
        useState("");

    const [showError, setShowError] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | Create Modal
    |--------------------------------------------------------------------------
    */

    const [showCreateModal, setShowCreateModal] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | Edit Modal
    |--------------------------------------------------------------------------
    */

    const [showEditModal, setShowEditModal] =
        useState(false);

    const [selectedCategory, setSelectedCategory] =
        useState<Category | null>(null);

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const [page, setPage] =
        useState(1);

    /*
    | Number of categories displayed per page.
    |
    | You can change the default value here.
    |
    */

    const [limit, setLimit] =
        useState(5);

    const [totalPages, setTotalPages] =
        useState(1);

    const [totalCategories, setTotalCategories] =
        useState(0);

    /*
    |--------------------------------------------------------------------------
    | Category Management Permission
    |--------------------------------------------------------------------------
    |
    | Only ADMIN and MODERATOR can:
    |
    | - Create
    | - Edit
    | - Delete
    |
    */

    const canManageCategories =
        userRole === "ADMIN" ||
        userRole === "MODERATOR";

    /*
    |--------------------------------------------------------------------------
    | Get Logged-in User Role
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const role =
            localStorage.getItem("userRole");

        if (
            role === "ADMIN" ||
            role === "MODERATOR" ||
            role === "RIDER" ||
            role === "USER"
        ) {
            setUserRole(role);
        } else {
            setUserRole(null);
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Fetch Categories
    |--------------------------------------------------------------------------
    */

    const fetchCategories = async () => {
        try {
            setLoading(true);

            setError("");
            setShowError(false);

            const response =
                await axios.get<Category[]>(
                    `${API_BASE_URL}/categories`
                );

            console.log(
                "Categories API Response:",
                response.data
            );

            /*
            |--------------------------------------------------------------------------
            | All Categories
            |--------------------------------------------------------------------------
            */

            const allCategories =
                response.data;

            /*
            |--------------------------------------------------------------------------
            | Total Categories
            |--------------------------------------------------------------------------
            */

            setTotalCategories(
                allCategories.length
            );

            /*
            |--------------------------------------------------------------------------
            | Calculate Total Pages
            |--------------------------------------------------------------------------
            */

            const calculatedTotalPages =
                Math.ceil(
                    allCategories.length / limit
                );

            const finalTotalPages =
                calculatedTotalPages > 0
                    ? calculatedTotalPages
                    : 1;

            setTotalPages(
                finalTotalPages
            );

            /*
            |--------------------------------------------------------------------------
            | Protect Current Page
            |--------------------------------------------------------------------------
            */

            if (
                page > finalTotalPages
            ) {
                setPage(
                    finalTotalPages
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Calculate Current Page Data
            |--------------------------------------------------------------------------
            */

            const startIndex =
                (page - 1) * limit;

            const endIndex =
                startIndex + limit;

            const currentPageCategories =
                allCategories.slice(
                    startIndex,
                    endIndex
                );

            /*
            |--------------------------------------------------------------------------
            | Set Current Page Categories
            |--------------------------------------------------------------------------
            */

            setCategories(
                currentPageCategories
            );
        } catch (error: unknown) {
            console.error(
                "Failed to fetch categories:",
                error
            );

            if (
                axios.isAxiosError(error)
            ) {
                const backendMessage =
                    error.response?.data?.message;

                if (
                    Array.isArray(
                        backendMessage
                    )
                ) {
                    setError(
                        backendMessage.join(", ")
                    );
                } else {
                    setError(
                        backendMessage ||
                            "Failed to load categories."
                    );
                }
            } else {
                setError(
                    "Something went wrong while loading categories."
                );
            }

            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Fetch Categories When Page OR Limit Changes
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        fetchCategories();
    }, [page, limit]);

    /*
    |--------------------------------------------------------------------------
    | Change Categories Per Page
    |--------------------------------------------------------------------------
    */

    const handleLimitChange = (
        newLimit: number
    ) => {
        setLimit(newLimit);

        /*
        | Whenever the number of categories
        | per page changes, go back to page 1.
        */

        setPage(1);
    };

    /*
    |--------------------------------------------------------------------------
    | Create Category Success
    |--------------------------------------------------------------------------
    */

    const handleCreateSuccess =
        async () => {
            setShowCreateModal(false);

            /*
            |--------------------------------------------------------------------------
            | Go to first page after creation
            |--------------------------------------------------------------------------
            */

            if (page !== 1) {
                setPage(1);
            } else {
                await fetchCategories();
            }
        };

    /*
    |--------------------------------------------------------------------------
    | Edit Category
    |--------------------------------------------------------------------------
    */

    const handleEdit = (
        category: Category
    ) => {
        if (!canManageCategories) {
            return;
        }

        setSelectedCategory(
            category
        );

        setShowEditModal(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Edit Category Success
    |--------------------------------------------------------------------------
    */

    const handleEditSuccess =
        async () => {
            setShowEditModal(false);

            setSelectedCategory(null);

            await fetchCategories();
        };

    /*
    |--------------------------------------------------------------------------
    | Delete Category
    |--------------------------------------------------------------------------
    */

    const handleDelete = async (
        categoryId: string
    ) => {
        /*
        |--------------------------------------------------------------------------
        | Frontend Permission Check
        |--------------------------------------------------------------------------
        */

        if (!canManageCategories) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Confirmation
        |--------------------------------------------------------------------------
        */

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this category?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);

            setError("");
            setShowError(false);

            /*
            |--------------------------------------------------------------------------
            | Delete Request
            |--------------------------------------------------------------------------
            |
            | withCredentials: true
            | sends the access_token cookie.
            |
            */

            await axios.delete(
                `${API_BASE_URL}/categories/${categoryId}`,
                {
                    withCredentials: true,
                }
            );

            /*
            |--------------------------------------------------------------------------
            | Refresh Categories
            |--------------------------------------------------------------------------
            */

            await fetchCategories();
        } catch (error: unknown) {
            console.error(
                "Failed to delete category:",
                error
            );

            if (
                axios.isAxiosError(error)
            ) {
                const backendMessage =
                    error.response?.data?.message;

                if (
                    Array.isArray(
                        backendMessage
                    )
                ) {
                    setError(
                        backendMessage.join(", ")
                    );
                } else {
                    setError(
                        backendMessage ||
                            "Failed to delete category."
                    );
                }
            } else {
                setError(
                    "Something went wrong while deleting category."
                );
            }

            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Previous Page
    |--------------------------------------------------------------------------
    */

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage(
                page - 1
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Next Page
    |--------------------------------------------------------------------------
    */

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage(
                page + 1
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Image URL
    |--------------------------------------------------------------------------
    */

    const getImageUrl = (
        image: string | null
    ) => {
        if (!image) {
            return null;
        }

        return `${API_BASE_URL}/uploads/category/${encodeURIComponent(
            image
        )}`;
    };

    /*
    |--------------------------------------------------------------------------
    | Showing Range
    |--------------------------------------------------------------------------
    */

    const showingFrom =
        totalCategories === 0
            ? 0
            : (page - 1) * limit + 1;

    const showingTo =
        Math.min(
            page * limit,
            totalCategories
        );

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="min-h-screen bg-zinc-50">

            {/* ================================================================
                Navbar
            ================================================================= */}

            <RoleBasedNavbar />

            {/* ================================================================
                Main
            ================================================================= */}

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                {/* ============================================================
                    Page Header
                ============================================================= */}

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">
                            Categories
                        </h1>

                        <p className="mt-1 text-sm text-zinc-500">
                            Browse and manage tool categories
                        </p>
                    </div>

                    {/* ========================================================
                        Create Button
                    ========================================================= */}

                    {canManageCategories && (
                        <button
                            type="button"
                            onClick={() =>
                                setShowCreateModal(
                                    true
                                )
                            }
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            + Create Category
                        </button>
                    )}
                </div>

                {/* ============================================================
                    Statistics
                ============================================================= */}

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    {/* Total Categories */}

                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-zinc-500">
                            Total Categories
                        </p>

                        <p className="mt-1 text-2xl font-bold text-zinc-900">
                            {totalCategories}
                        </p>
                    </div>

                    {/* Current Page */}

                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-zinc-500">
                            Current Page
                        </p>

                        <p className="mt-1 text-2xl font-bold text-zinc-900">
                            {page}
                        </p>
                    </div>
                </div>

                {/* ============================================================
                    Category Container
                ============================================================= */}

                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">

                    {/* ========================================================
                        List Header
                    ========================================================= */}

                    <div className="flex flex-col gap-3 border-b border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                        <h2 className="font-semibold text-zinc-900">
                            Category List
                        </h2>

                        {/* ====================================================
                            Categories Per Page
                        ==================================================== */}

                        <div className="flex items-center gap-2">

                            <span className="text-sm text-zinc-500">
                                Show
                            </span>

                            <select
                                value={limit}
                                onChange={(event) =>
                                    handleLimitChange(
                                        Number(
                                            event.target.value
                                        )
                                    )
                                }
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value={2}>
                                    2
                                </option>

                                <option value={4}>
                                    4
                                </option>

                                <option value={6}>
                                    6
                                </option>

                                <option value={10}>
                                    10
                                </option>
                            </select>

                            <span className="text-sm text-zinc-500">
                                per page
                            </span>

                        </div>

                    </div>

                    {/* ========================================================
                        Empty State
                    ========================================================= */}

                    {categories.length === 0 && !loading ? (
                        <div className="px-6 py-16 text-center">

                            <p className="text-sm text-zinc-500">
                                No categories found.
                            </p>

                            {canManageCategories && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCreateModal(
                                            true
                                        )
                                    }
                                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                    Create First Category
                                </button>
                            )}

                        </div>
                    ) : (
                        <>
                            {/* =================================================
                                Category List
                            ================================================== */}

                            <div className="divide-y divide-zinc-100">

                                {categories.map(
                                    (
                                        category
                                    ) => (
                                        <div
                                            key={
                                                category.categoryId
                                            }
                                            className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                                        >

                                            {/* ==================================
                                                Category Information
                                            ================================== */}

                                            <div className="flex min-w-0 flex-1 items-center gap-4">

                                                {/* Category Image */}

                                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">

                                                    {category.image ? (
                                                        <img
                                                            src={
                                                                getImageUrl(
                                                                    category.image
                                                                ) ||
                                                                ""
                                                            }
                                                            alt={
                                                                category.name
                                                            }
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                                                            No Image
                                                        </div>
                                                    )}

                                                </div>

                                                {/* Category Details */}

                                                <div className="min-w-0">

                                                    <div className="flex flex-wrap items-center gap-2">

                                                        <h3 className="font-semibold text-zinc-900">
                                                            {
                                                                category.name
                                                            }
                                                        </h3>

                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                category.status ===
                                                                "ACTIVE"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-red-100 text-red-700"
                                                            }`}
                                                        >
                                                            {
                                                                category.status
                                                            }
                                                        </span>

                                                    </div>

                                                    <p className="mt-1 text-xs font-medium text-blue-600">
                                                        {
                                                            category.categoryId
                                                        }
                                                    </p>

                                                    <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                                                        {
                                                            category.description ||
                                                            "No description available."
                                                        }
                                                    </p>

                                                </div>

                                            </div>

                                            {/* ==================================
                                                Actions
                                            ================================== */}

                                            {canManageCategories && (
                                                <div className="flex shrink-0 gap-2">

                                                    {/* Edit */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                category
                                                            )
                                                        }
                                                        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                                                    >
                                                        Edit
                                                    </button>

                                                    {/* Delete */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                category.categoryId
                                                            )
                                                        }
                                                        disabled={
                                                            loading
                                                        }
                                                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>

                                                </div>
                                            )}

                                        </div>
                                    )
                                )}

                            </div>

                            {/* =================================================
                                Pagination
                            ================================================== */}

                            {totalCategories > 0 && (
                                <div className="flex flex-col gap-4 border-t border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                                    {/* ==========================================
                                        Showing Information
                                    =========================================== */}

                                    <div>
                                        <p className="text-sm text-zinc-500">
                                            Showing{" "}

                                            <span className="font-medium text-zinc-700">
                                                {showingFrom}
                                            </span>

                                            {"–"}

                                            <span className="font-medium text-zinc-700">
                                                {showingTo}
                                            </span>

                                            {" "}of{" "}

                                            <span className="font-medium text-zinc-700">
                                                {totalCategories}
                                            </span>

                                            {" "}categories
                                        </p>

                                        <p className="mt-1 text-xs text-zinc-400">
                                            Page{" "}

                                            <span className="font-medium text-zinc-600">
                                                {page}
                                            </span>

                                            {" "}of{" "}

                                            <span className="font-medium text-zinc-600">
                                                {totalPages}
                                            </span>
                                        </p>
                                    </div>

                                    {/* ==========================================
                                        Pagination Controls
                                    =========================================== */}

                                    <div className="flex items-center gap-2">

                                        {/* Previous */}

                                        <button
                                            type="button"
                                            onClick={
                                                handlePreviousPage
                                            }
                                            disabled={
                                                page === 1 ||
                                                loading
                                            }
                                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Previous
                                        </button>

                                        {/* Current Page */}

                                        <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">
                                            {page}
                                        </div>

                                        {/* Next */}

                                        <button
                                            type="button"
                                            onClick={
                                                handleNextPage
                                            }
                                            disabled={
                                                page ===
                                                    totalPages ||
                                                loading
                                            }
                                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Next
                                        </button>

                                    </div>

                                </div>
                            )}

                        </>
                    )}

                </div>

            </main>

            {/* ================================================================
                Create Category Modal
            ================================================================= */}

            {canManageCategories && (
                <CreateCategory
                    open={
                        showCreateModal
                    }
                    onClose={() =>
                        setShowCreateModal(
                            false
                        )
                    }
                    onSuccess={
                        handleCreateSuccess
                    }
                />
            )}

            {/* ================================================================
                Edit Category Modal
            ================================================================= */}

            {canManageCategories && (
                <EditCategory
                    open={
                        showEditModal
                    }
                    category={
                        selectedCategory
                    }
                    onClose={() => {
                        setShowEditModal(
                            false
                        );

                        setSelectedCategory(
                            null
                        );
                    }}
                    onSuccess={
                        handleEditSuccess
                    }
                />
            )}

            {/* ================================================================
                Loading
            ================================================================= */}

            <Loading
                show={loading}
            />

            {/* ================================================================
                Error
            ================================================================= */}

            <ErrorMessage
                message={error}
                show={showError}
                onClose={() =>
                    setShowError(false)
                }
            />

        </div>
    );
}