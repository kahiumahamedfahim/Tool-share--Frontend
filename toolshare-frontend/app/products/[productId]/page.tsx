"use client";







import { useCallback, useEffect, useState } from "react";







import { useParams, useRouter } from "next/navigation";







import Link from "next/link";







import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";







import ErrorMessage from "@/app/components/ErrorMessage";







import api from "@/app/lib/axios";







import { Product } from "../types/product";







const API_BASE_URL =



    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000";







interface ProductOwner {
    userId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
}

interface ProductResponse {
    data: Product & {
        isOwner?: boolean;
        owner?: ProductOwner;
    };
}

interface StoredUser {
    userId?: string;
}

type ProductDetails = Product & {
    isOwner?: boolean;
    owner?: ProductOwner;
};













function getFileUrl(path?: string): string {



    if (!path) {



        return "";



    }







    if (/^https?:\/\//i.test(path)) {



        return path;



    }







    return `${API_BASE_URL}/${path



        .replace(/\\/g, "/")



        .replace(/^\/+/, "")}`;



}







export default function ProductDetailsPage() {



    const params = useParams<{ productId: string }>();







    const router = useRouter();







    const productId = params.productId;







    const [product, setProduct] =



        useState<ProductDetails | null>(null);







    const [loading, setLoading] =



        useState(true);







    const [apiError, setApiError] =



        useState("");







    const [activeImageIndex, setActiveImageIndex] =



        useState(0);

    // -----------------------------------------------------

    // Logged-in user / authentication state

    // -----------------------------------------------------

    const [currentUserId, setCurrentUserId] =
        useState<string | null>(null);

    const [authChecked, setAuthChecked] =
        useState(false);









    // -----------------------------------------------------



    // Delete states



    // -----------------------------------------------------







    const [showDeleteModal, setShowDeleteModal] =



        useState(false);







    const [deleting, setDeleting] =



        useState(false);







    const [deleteError, setDeleteError] =



        useState("");









    // -----------------------------------------------------



    // Read the authenticated user from the backend.
    // The access_token is stored in an HttpOnly cookie, so the
    // frontend must not depend on localStorage to determine auth.
    useEffect(() => {
        let mounted = true;

        const loadCurrentUser = async () => {
            try {
                const response = await api.get<{
                    userId: string;
                    role: string;
                }>("/auth/profile");

                if (!mounted) return;

                if (response.data?.userId) {
                    setCurrentUserId(response.data.userId);
                } else {
                    setCurrentUserId(null);
                }
            } catch (error) {
                if (!mounted) return;

                console.log(
                    "No authenticated user found:",
                    error,
                );
                setCurrentUserId(null);
            } finally {
                if (mounted) {
                    setAuthChecked(true);
                }
            }
        };

        loadCurrentUser();

        return () => {
            mounted = false;
        };
    }, []);



    // Get Product Details



    // -----------------------------------------------------







    const getProductDetails =



        useCallback(async () => {



            if (!productId) {



                return;



            }







            try {



                setLoading(true);



                setApiError("");







                const response =



                    await api.get<ProductResponse>(



                        `/products/${encodeURIComponent(



                            productId,



                        )}`,



                    );







                setProduct(



                    response.data.data,



                );







                setActiveImageIndex(0);



            } catch (error) {



                console.error(



                    "Error fetching product details:",



                    error,



                );







                const responseData =



                    (



                        error as {



                            response?: {



                                data?: {



                                    message?:



                                        | string



                                        | string[];



                                };



                            };



                        }



                    ).response?.data;







                const message =



                    responseData?.message;







                setApiError(



                    Array.isArray(message)



                        ? message.join(", ")



                        : message ||



                              "Could not load product details.",



                );



            } finally {



                setLoading(false);



            }



        }, [productId]);







    useEffect(() => {



        void getProductDetails();



    }, [getProductDetails]);







    // -----------------------------------------------------



    // Delete Product



    // -----------------------------------------------------







    const handleDeleteProduct =



        async () => {



            if (!product) {



                return;



            }







            try {



                setDeleting(true);



                setDeleteError("");







                await api.delete(



                    `/products/${encodeURIComponent(



                        product.productId,



                    )}`,



                );







                setShowDeleteModal(false);







                router.push(



                    "/products/my-products",



                );



            } catch (error) {



                console.error(



                    "Failed to delete product:",



                    error,



                );







                const responseData =



                    (



                        error as {



                            response?: {



                                data?: {



                                    message?:



                                        | string



                                        | string[];



                                };



                            };



                        }



                    ).response?.data;







                const message =



                    responseData?.message;







                setDeleteError(



                    Array.isArray(message)



                        ? message.join(", ")



                        : message ||



                              "Failed to delete product.",



                );



            } finally {



                setDeleting(false);



            }



        };







    // -----------------------------------------------------



    // Loading



    // -----------------------------------------------------







    if (loading) {



        return (



            <main className="min-h-screen bg-zinc-50 px-4 py-10">



                <p className="text-center text-zinc-600">



                    Loading product details...



                </p>



            </main>



        );



    }







    // -----------------------------------------------------



    // Error



    // -----------------------------------------------------







    if (apiError || !product) {



        return (



            <main className="min-h-screen bg-zinc-50 px-4 py-10">



                <div className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-white p-6">



                    <h1 className="text-xl font-semibold text-zinc-900">



                        Unable to load product



                    </h1>







                    <p className="mt-2 text-sm text-red-600">



                        {apiError ||



                            "Product not found."}



                    </p>



                </div>



            </main>



        );



    }







    // -----------------------------------------------------



    // Images



    // -----------------------------------------------------







    const images =



        product.productImages ?? [];







    const safeImageIndex = Math.min(



        activeImageIndex,



        Math.max(images.length - 1, 0),



    );







    const activeImage =



        images[safeImageIndex];

    // -----------------------------------------------------

    // Owner / authentication check

    // -----------------------------------------------------



    const isOwner = product.isOwner === true;



    // `currentUserId` is state, so the page re-renders after
    // localStorage authentication information is loaded.
    const isLoggedIn =
        authChecked && !!currentUserId;

    const canRent = isLoggedIn && !isOwner;





    // UI



    // -----------------------------------------------------







    return (



        <>



            <RoleBasedNavbar />







            <main className="min-h-screen bg-slate-50">



                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">







                    {/* Breadcrumb */}







                    <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">



                        <Link



                            href="/products"



                            className="transition hover:text-blue-600"



                        >



                            Products



                        </Link>







                        <span>/</span>







                        <span className="font-medium text-slate-700">



                            Product Details



                        </span>



                    </div>







                    {/* Product Heading */}







                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">







                        <div>



                            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">



                                {product.category?.name ||



                                    "General"}



                            </span>







                            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">



                                {product.name}



                            </h1>







                            <p className="mt-2 text-sm text-slate-500">



                                Product ID:{" "}



                                {product.productId}



                            </p>



                        </div>







                        <span



                            className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${



                                product.availabilityStatus ===



                                "AVAILABLE"



                                    ? "bg-emerald-50 text-emerald-700"



                                    : "bg-amber-50 text-amber-700"



                            }`}



                        >



                            <span className="h-2 w-2 rounded-full bg-current" />







                            {product.availabilityStatus}



                        </span>



                    </div>







                    {/* Main Product Section */}







                    <div className="grid gap-8 lg:grid-cols-5">







                        {/* Product Image Gallery */}







                        <section className="lg:col-span-3">



                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">







                                <div className="flex min-h-80 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 sm:min-h-[440px]">







                                    {activeImage ? (



                                        <img



                                            src={getFileUrl(



                                                activeImage.filePath,



                                            )}



                                            alt={`${product.name} - image ${



                                                safeImageIndex + 1



                                            }`}



                                            className="max-h-[520px] min-h-80 w-full object-contain p-4 sm:min-h-[440px]"



                                        />



                                    ) : (



                                        <div className="text-center">



                                            <div className="text-7xl">



                                                🛠️



                                            </div>







                                            <p className="mt-4 text-sm text-slate-500">



                                                No product image available



                                            </p>



                                        </div>



                                    )}



                                </div>







                                {/* Image counter */}







                                {images.length > 0 && (



                                    <div className="border-t border-slate-100 px-5 py-3">



                                        <p className="text-sm font-medium text-slate-600">



                                            Image{" "}



                                            {safeImageIndex +



                                                1}{" "}



                                            of{" "}



                                            {images.length}



                                        </p>



                                    </div>



                                )}







                                {/* Clickable thumbnails */}







                                {images.length > 1 && (



                                    <div className="border-t border-slate-100 p-4">



                                        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">







                                            {images.map(



                                                (



                                                    image,



                                                    index,



                                                ) => {



                                                    const imageUrl =



                                                        getFileUrl(



                                                            image.filePath,



                                                        );







                                                    return (



                                                        <button



                                                            key={



                                                                image.id ??



                                                                `${product.productId}-${index}`



                                                            }



                                                            type="button"



                                                            onClick={() =>



                                                                setActiveImageIndex(



                                                                    index,



                                                                )



                                                            }



                                                            aria-label={`View image ${



                                                                index +



                                                                1



                                                            }`}



                                                            aria-pressed={



                                                                safeImageIndex ===



                                                                index



                                                            }



                                                            className={`overflow-hidden rounded-xl border-2 bg-slate-50 transition ${



                                                                safeImageIndex ===



                                                                index



                                                                    ? "border-blue-600 ring-2 ring-blue-100"



                                                                    : "border-transparent hover:border-slate-300"



                                                            }`}



                                                        >



                                                            <img



                                                                src={



                                                                    imageUrl



                                                                }



                                                                alt={`${product.name} thumbnail ${



                                                                    index +



                                                                    1



                                                                }`}



                                                                className="h-20 w-full object-cover sm:h-24"



                                                                loading="lazy"



                                                            />



                                                        </button>



                                                    );



                                                },



                                            )}







                                        </div>



                                    </div>



                                )}







                                <div className="border-t border-slate-100 px-5 py-4">



                                    <p className="text-sm font-medium text-slate-700">



                                        <span className="mr-2">



                                            📦



                                        </span>



                                        Product overview



                                    </p>







                                    <p className="mt-1 text-sm text-slate-500">



                                        Review the product details before proceeding with a rental.



                                    </p>



                                </div>







                            </div>



                        </section>







                        {/* Pricing and Product Summary */}







                        <section className="lg:col-span-2">



                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">







                                <p className="text-sm font-medium text-slate-500">



                                    Rental price



                                </p>







                                <div className="mt-2 flex items-baseline gap-2">



                                    <span className="text-4xl font-bold tracking-tight text-slate-900">



                                        ৳



                                        {Number(



                                            product.pricePerDay,



                                        ).toFixed(2)}



                                    </span>







                                    <span className="text-sm text-slate-500">



                                        / day



                                    </span>



                                </div>







                                <div className="mt-6 border-t border-slate-100 pt-6">







                                    <h2 className="text-lg font-semibold text-slate-900">



                                        Product information



                                    </h2>







                                    <div className="mt-5 space-y-5">







                                        <div className="flex items-start justify-between gap-4">



                                            <span className="text-sm text-slate-500">



                                                Category



                                            </span>







                                            <span className="text-right text-sm font-medium text-slate-800">



                                                {product.category?.name ||



                                                    "Uncategorized"}



                                            </span>



                                        </div>







                                        <div className="flex items-start justify-between gap-4">



                                            <span className="text-sm text-slate-500">



                                                Product ID



                                            </span>







                                            <span className="text-right text-sm font-medium text-slate-800">



                                                {product.productId}



                                            </span>



                                        </div>







                                        <div className="flex items-start justify-between gap-4">



                                            <span className="text-sm text-slate-500">



                                                Availability



                                            </span>







                                            <span className="text-right text-sm font-semibold text-slate-800">



                                                {product.availabilityStatus}



                                            </span>



                                        </div>







                                        <div className="flex items-start justify-between gap-4">



                                            <span className="text-sm text-slate-500">



                                                Negotiation



                                            </span>







                                            <span



                                                className={`text-right text-sm font-semibold ${



                                                    product.negotiationAllowed



                                                        ? "text-emerald-700"



                                                        : "text-slate-600"



                                                }`}



                                            >



                                                {product.negotiationAllowed



                                                    ? "Available"



                                                    : "Not available"}



                                            </span>



                                        </div>







                                        <div className="flex items-start justify-between gap-4">



                                            <span className="text-sm text-slate-500">



                                                Rental duration



                                            </span>







                                            <span className="text-right text-sm font-semibold text-slate-800">



                                                {product.minRentalDays}{" "}



                                                -{" "}



                                                {product.maxRentalDays}{" "}



                                                days



                                            </span>



                                        </div>







                                        <div className="flex items-start justify-between gap-4">



                                            <span className="text-sm text-slate-500">



                                                Same-day rental



                                            </span>







                                            <span



                                                className={`text-right text-sm font-semibold ${



                                                    product.allowSameDayRental



                                                        ? "text-emerald-700"



                                                        : "text-slate-600"



                                                }`}



                                            >



                                                {product.allowSameDayRental



                                                    ? "Available"



                                                    : "Not available"}



                                            </span>



                                        </div>







                                    </div>



                                </div>

                    </div>

                        {/* Owner / Renter Actions */}

                        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                            <div className="border-b border-slate-200 bg-white px-5 py-4">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg">

                                        {isOwner ? "🏠" : "🛒"}

                                    </div>

                                    <div>

                                        <h2 className="text-sm font-bold text-slate-900">

                                            {isOwner ? "Manage your product" : "Rent this product"}

                                        </h2>

                                        <p className="mt-0.5 text-xs text-slate-500">

                                            {isOwner

                                                ? "Update or remove your listing."

                                                : "Start a rental request for this product."}

                                        </p>

                                    </div>

                                </div>

                            </div>



                            <div className="p-5">

                                {isOwner ? (

                                    <>

                                        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">

                                            <p className="text-sm font-semibold text-blue-900">

                                                This is your product

                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-blue-800">

                                                You can update the listing or delete it if there are no active rental requests.

                                            </p>

                                        </div>



                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">

                                            <Link

                                                href={`/products/${product.productId}/edit`}

                                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"

                                            >

                                                Update Product

                                            </Link>



                                            <button

                                                type="button"

                                                onClick={() => setShowDeleteModal(true)}

                                                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"

                                            >

                                                Delete Product

                                            </button>

                                        </div>

                                    </>

                                ) : canRent ? (

                                    <>

                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">

                                            <p className="text-sm font-semibold text-emerald-900">

                                                Ready to rent?

                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-emerald-800">

                                                Choose your rental dates, delivery location, and submit your request.

                                            </p>

                                        </div>



                                        <Link

                                            href={`/products/${product.productId}/rent`}

                                            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"

                                        >

                                            Rent Now

                                        </Link>

                                    </>

                                ) : (

                                    <>

                                        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">

                                            <p className="text-sm font-semibold text-amber-900">

                                                Login required

                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-amber-800">

                                                You need to login before you can make a rental request.

                                            </p>

                                        </div>



                                        <button

                                            type="button"

                                            disabled

                                            className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-slate-300 px-4 py-3 text-sm font-semibold text-slate-600"

                                        >

                                            Login to Rent

                                        </button>

                                    </>

                                )}

                            </div>

                        </div>

                    </section>





                    </div>







                    {/* Description */}







                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">







                        <div className="flex items-center gap-3">







                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">



                                📝



                            </div>







                            <div>



                                <h2 className="text-lg font-bold text-slate-900">



                                    About this product



                                </h2>







                                <p className="text-sm text-slate-500">



                                    Product description and details



                                </p>



                            </div>







                        </div>







                        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">



                            {product.description ||



                                "No description has been provided."}



                        </p>







                    </section>







                    {/* Owner Information */}







                    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">







                        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">







                            <h2 className="text-xl font-bold text-slate-900">



                                Product owner



                            </h2>







                            <p className="mt-1 text-sm text-slate-500">



                                Information about the person who listed this product



                            </p>







                        </div>







                        <div className="p-6 sm:p-8">







                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">







                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">



                                    {product.owner?.firstName



                                        ?.charAt(0)



                                        ?.toUpperCase() ||



                                        "U"}



                                </div>







                                <div>







                                    <h3 className="text-lg font-semibold text-slate-900">



                                        {product.owner



                                            ? `${product.owner.firstName} ${product.owner.lastName}`



                                            : "Owner information unavailable"}



                                    </h3>







                                    <p className="mt-1 text-sm text-slate-500">



                                        User ID:{" "}



                                        {product.owner?.userId ||



                                            product.ownerId}



                                    </p>







                                </div>







                            </div>







                            <div className="mt-7 grid gap-4 sm:grid-cols-2">







                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">







                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">



                                        Email address



                                    </p>







                                    <p className="mt-2 break-all text-sm font-medium text-slate-800">



                                        {product.owner?.email ||



                                            "Not available"}



                                    </p>







                                </div>







                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">







                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">



                                        Phone number



                                    </p>







                                    <p className="mt-2 text-sm font-medium text-slate-800">



                                        {product.owner?.phone ||



                                            "Not available"}



                                    </p>







                                </div>







                            </div>







                        </div>



                    </section>







                    {/* Product Documents */}







                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">







                        <div className="flex items-start gap-3">







                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xl">



                                📄



                            </div>







                            <div>







                                <h2 className="text-xl font-bold text-slate-900">



                                    Product documents



                                </h2>







                                <p className="mt-1 text-sm text-slate-500">



                                    Documents attached to this product listing



                                </p>







                            </div>







                        </div>







                        {product.productDocuments?.length ? (



                            <div className="mt-6 grid gap-4 sm:grid-cols-2">







                                {product.productDocuments.map(



                                    (document) => (



                                        <div



                                            key={



                                                document.filePath



                                            }



                                            className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"



                                        >







                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-600">



                                                PDF



                                            </div>







                                            <div className="min-w-0 flex-1">







                                                <p className="font-semibold text-slate-800">



                                                    Product document



                                                </p>







                                                <p className="mt-1 truncate text-xs text-slate-500">



                                                    {document.filePath?.split(/[\\\\/]/).pop()}



                                                </p>







                                            </div>







                                            <a



                                                href={getFileUrl(



                                                    document.filePath,



                                                )}



                                                target="\\\_blank"



                                                rel="noopener noreferrer"



                                                className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"



                                            >



                                                View



                                            </a>







                                        </div>



                                    ),



                                )}







                            </div>



                        ) : (



                            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">







                                <div className="text-3xl">



                                    📂



                                </div>







                                <p className="mt-3 font-semibold text-slate-800">



                                    No documents uploaded



                                </p>







                                <p className="mt-1 text-sm text-slate-500">



                                    No product documents are available for this listing.



                                </p>







                            </div>



                        )}







                    </section>







                    {/* Footer Note */}







                    <div className="mt-8 rounded-xl border border-amber-100 bg-amber-50 p-4">







                        <p className="text-sm leading-6 text-amber-900">







                            <span className="font-semibold">



                                Please note:



                            </span>{" "}







                            Confirm the product details and rental terms before proceeding. Availability may change over time.







                        </p>







                    </div>







                </div>



            </main>







            {/* Delete Confirmation Modal */}







            {showDeleteModal && (



                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">







                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">







                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">



                            ⚠️



                        </div>







                        <h2 className="mt-4 text-xl font-bold text-slate-900">



                            Delete product?



                        </h2>







                        <p className="mt-2 text-sm leading-6 text-slate-600">



                            Are you sure you want to delete{" "}



                            <span className="font-semibold text-slate-900">



                                {product.name}



                            </span>



                            ? This action cannot be undone.



                        </p>







                        {deleteError && (



                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">



                                {deleteError}



                            </div>



                        )}







                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">







                            <button



                                type="button"



                                disabled={deleting}



                                onClick={() => {



                                    setShowDeleteModal(false);



                                    setDeleteError("");



                                }}



                                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"



                            >



                                Cancel



                            </button>







                            <button



                                type="button"



                                disabled={deleting}



                                onClick={handleDeleteProduct}



                                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"



                            >



                                {deleting



                                    ? "Deleting..."



                                    : "Yes, Delete"}



                            </button>







                        </div>







                    </div>



                </div>



            )}







            {/* Backend Error Modal */}







            <ErrorMessage



                message={deleteError}



                show={



                    !!deleteError &&



                    !showDeleteModal



                }



                onClose={() =>



                    setDeleteError("")



                }



            />



        </>



)



}




