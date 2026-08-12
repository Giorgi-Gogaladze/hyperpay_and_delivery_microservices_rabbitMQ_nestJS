import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { realpath } from 'fs';
import { Cart } from '../../generated/prisma/client';

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

    


}
