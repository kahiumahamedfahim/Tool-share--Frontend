export interface ProductCategory {
    categoryId?: string;
    name?: string;
}

export interface ProductImage {
    filePath?: string;
    imageUrl?: string;
    url?: string;
}

export interface ProductDocument {
    filePath?: string;
    documentUrl?: string;
    url?: string;
}

export interface ProductOwner {
    userId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
}

export interface ProductLocation {
    latitude?: number | string;
    longitude?: number | string;
    division?: string;
    district?: string;
    upazila?: string;
    pickupAddress?: string;
}

export interface Product {
    id: string;
    productId: string;

    ownerId: string;
    categoryId: string;

    name: string;
    description: string;

    pricePerDay: number | string;

    negotiationAllowed: boolean;

    minRentalDays: number;
    maxRentalDays: number;
    preparationBufferDays: number;
    allowSameDayRental: boolean;

    availabilityStatus?: string;

    category?: ProductCategory;
    owner?: ProductOwner;
    location?: ProductLocation;

    productImages?: ProductImage[];
    productDocuments?: ProductDocument[];

    // Kept for compatibility with the existing ProductList response.
    images?: ProductImage[];
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ProductsResponse {
    data: Product[];
    meta?: Partial<PaginationMeta>;
}