import { Order, Prisma } from "../generated/prisma/client";

export type OrderListItems = Prisma.OrderGetPayload<{
    include: {
        address: true,
        orderItems: true,
        _count: {
            select: {orderItems: true}
        },
    }
}>



export type OrderDetailed = Prisma.OrderGetPayload<{
  include: {
    orderItems: true;
    address: true;
  };
}>;


export interface OrdersWithDetails {
  data: Order[];
  meta: {
    page: number;
    total: number;
    limit: number;
    totalPages: number;
  }
}