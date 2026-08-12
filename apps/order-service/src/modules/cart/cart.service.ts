import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Cart, CartItem } from '../../generated/prisma/client';
import { AddCartItemDto } from './dtos/add-cart-item.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { CartWithItems } from '../../types/cart-with-items.type';



@Injectable()
export class CartService {
    constructor(
        private readonly prisma: PrismaService
    ){}

    private async getOrCreateCart(userId: string):Promise<Cart>{
        let cart = await this.prisma.cart.findFirst({
            where: {userId},
        });

        if(!cart){cart = await this.prisma.cart.create({ data: {userId}})};

        return cart;
    };


    async getMyCart(userId: string): Promise<CartWithItems>{
        return await this.prisma.cart.upsert({
            where: { userId },
            update: {},
            create: {userId},
            include: {cartItems: true}
        });
    }


    async addItemToCart(
        userId: string, 
        dto: AddCartItemDto
    ): Promise<CartItem>{
        const cart = await this.getOrCreateCart(userId);

        const existingItem = await this.prisma.cartItem.findUnique({
            where: {
                cartId_productVariantId: {
                    cartId: cart.id,
                    productVariantId: dto.productVariantId,
                },
            },
        });

        if(existingItem){
            await this.prisma.cartItem.update({
                where: {id: existingItem.id},
                data: { quantity: {increment: dto.quantity}}
            })
        };

        return this.prisma.cartItem.create({
            data: {
                productVariantId: dto.productVariantId,
                cartId: cart.id,
                quantity: dto.quantity
            },
        });
    }

   
    async updateItem(
        userId: string, 
        itemId: string, 
        dto: UpdateCartItemDto
    ): Promise<CartItem>{
        const item = await this.prisma.cartItem.findFirst({
            where: {id: itemId, cart: {userId}}
        });

        if (!item) {
            throw new NotFoundException('Cart item not found');
        }

        return await this.prisma.cartItem.update({
            where: {id: itemId},
            data: {
                quantity: dto.quantity
            }
        });
        
    }


    async removeItemFromCart(
        itemId: string,
        userId: string
    ): Promise<{message: string}>{
        const item = await this.prisma.cartItem.findFirst({
            where: {id: itemId, cart: {userId}}
        });

        if (!item) {
            throw new NotFoundException('Cart item not found');
        }

        await this.prisma.cartItem.delete({where: {id: itemId,} });
        return {message: 'item removed successfully'};
    }

    
    async clearCart(
        userId: string
    ): Promise<{message: string}>{
        await this.prisma.cart.deleteMany({
            where: {userId}
        });

        return {message: 'cart cleared successfully'}
    }


    async deleteCart(
        userId: string,
    ): Promise<{message: string}>{
        await this.prisma.cart.deleteMany({
            where: {userId}
        });
        return{ message: 'Cart cleared successfully'}
    }
}
