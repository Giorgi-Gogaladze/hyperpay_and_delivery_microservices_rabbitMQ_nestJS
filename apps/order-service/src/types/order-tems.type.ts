import { Prisma } from "../generated/prisma/client";

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