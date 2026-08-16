import { IsEnum, IsNotEmpty } from "class-validator";
import { OrderStatus } from "../../../generated/prisma/enums";
import { OrdersController } from "../orders.controller";

export class UpdateOrderStatusDto {
    @IsEnum(OrdersController)
    @IsNotEmpty()
    status: OrderStatus;
}