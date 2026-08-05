import { Product } from "../generated/prisma/client";

export interface IProductWithNames extends Product {
  brand?: { name: string };
  category?: { name: string };
}