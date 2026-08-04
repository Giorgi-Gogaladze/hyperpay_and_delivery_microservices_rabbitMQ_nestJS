import { Product } from "../generated/prisma/client";

export interface PaginatedProductsResponcse {
    data: Product[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    }
}