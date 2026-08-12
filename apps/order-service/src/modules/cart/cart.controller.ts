import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard, Public, User } from '@app/common';
import { CartWithItems } from '../../types/cart-with-items.type';
import { AddCartItemDto } from './dtos/add-cart-item.dto';
import { CartItem } from '../../generated/prisma/client';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {

  private logger = new Logger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  @Get()
  async getMyCart(
    @User('id') userId: string
  ): Promise<CartWithItems>{
    return await this.cartService.getMyCart(userId)
  }

  @Post()
  async addItemToCart(
    @User('id') userId: string,
    @Body() dto: AddCartItemDto
  ): Promise<CartItem>{
    return await this.cartService.addItemToCart(userId, dto)
  }

  @Patch(':itemId')
  async updateItem(
    @User('id') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto
  ): Promise<CartItem>{
    return await this.cartService.updateItem(userId, itemId, dto);
  }
  
  @Public()
  @EventPattern('user.deleted')
  async deleteCart(
    @Payload() data: {userId: string},
    @Ctx() context: RmqContext
  ){

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.cartService.deleteCart(data.userId)
      channel.ack(originalMsg)
    } catch (error: any) {
        this.logger.error(`Failed to delete cart for user ${data.userId}`, error);
        channel.nack(originalMsg, false, false);
    }
  }

  @Delete()
  async clearCart(@User('id') userId: string): Promise<{ message: string }> {
    return await this.cartService.clearCart(userId);
  }

  @Delete(':itemId')
  async removeItemFromCart(
    @User('id') userId: string,
    @Param('itemId') itemId: string,
  ): Promise<{message: string}>{
    return await this.cartService.removeItemFromCart(itemId, userId);
  }

}
