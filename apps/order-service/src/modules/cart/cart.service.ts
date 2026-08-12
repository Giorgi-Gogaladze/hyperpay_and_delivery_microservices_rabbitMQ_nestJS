import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Cart } from '../../generated/prisma/client';
import { AddCartItemDto } from './dtos/add-cart-item.dto';
import { existsSync } from 'fs';

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


    async getMyCart(userId: string){
        const cart = await this.prisma.cart.findFirst({
            where: { userId },
            include: { cartItems: true }
        });

        return cart ?? {userId, cartItems: []};
    }


    async addItemToCart(
        userId: string, 
        dto: AddCartItemDto
    ){
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

    


}
