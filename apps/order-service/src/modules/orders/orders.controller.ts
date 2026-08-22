import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards, Query, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard, User } from '@app/common';
import { CreateOrderDto } from './dtos/create-order.dto';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role, Roles } from '@app/common/decorators/roles.decorator';
import { QueryOrdersDto } from './dtos/query-orders.dto';
import { UpdateOrderStatusDto } from './dtos/update-status.dto';
import { OrderDetailed, OrderListItems, OrdersWithDetails } from '../../types/order-tems.type';

UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

@Post()
@HttpCode.apply(HttpStatus.CREATED)
async createOrder(
  @User('id') userId: string,
  @Body() dto: CreateOrderDto,
) {
  return await this.ordersService.createOrder(userId, dto);
}

@Get('my')
async getMyOrders(@User('id') userId: string): Promise<OrderListItems[]> {
  return await this.ordersService.getMyOrders(userId);
}

@Get('available-orders')
async getAvailableOrders(){
  return await this.ordersService.getAvailableOrders();
}


@Post(':id/claim')
@Roles(Role.COURIER)
claimOrder(
  @Param('id', ParseUUIDPipe) orderId: string,
  @User('id') userId: string,
) {
  return this.ordersService.claimOrder(userId, orderId);
}


@Get('my/:id')
  async getMyOrderDetails(
    @User('id') userId: string,
    @Param('id') orderId: string,
  ): Promise<OrderDetailed> {
    return await this.ordersService.getMyOrderDetails(userId, orderId);
  }

@Patch('my/:id/cancel')
  async cancelMyOrder(
    @User('id') userId: string,
    @Param('id') orderId: string,
  ): Promise<{message: string, refundAmount: number}> {
    return await this.ordersService.cancelMyOrder(userId, orderId);
}

@Get('admin/all')
@Roles(Role.ADMIN)
  async getAllOrders(
    @Query() query: QueryOrdersDto
  ): Promise<OrdersWithDetails> {
    return await this.ordersService.getAllOrders(query);
}

@Post(':id/deliver')
@Roles(Role.COURIER)
markDelivered(
  @Param('id', ParseUUIDPipe) id: string,
  @User('id') userId: string,
) {
  return this.ordersService.markDelivered(id, userId);
}


@Post(':id/picked_up')
@Roles(Role.COURIER)
markPickedUp(
  @Param('id', ParseUUIDPipe) id: string,
  @User('id') userId: string,
) {
  return this.ordersService.markPickedUp(id, userId);
}


@Patch('admin/:id/status')
@Roles(Role.ADMIN, Role.COURIER)
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    return await this.ordersService.updateOrderStatus(orderId, dto.status);
}

}