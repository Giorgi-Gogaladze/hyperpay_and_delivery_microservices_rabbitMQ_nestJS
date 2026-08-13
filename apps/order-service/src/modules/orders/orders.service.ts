import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { CartService } from '../cart/cart.service';
import { firstValueFrom, timeout } from 'rxjs';
import { VariantDetails } from '../../types/product-variant.interface';
import { CreateOrderDto } from './dtos/create-order.dto';
import { OrderDetailed, OrderListItems } from '../../types/order-tems.type';

@Injectable()
export class OrdersService {

    private logger = new Logger(OrdersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cartService: CartService,
        @Inject('CATALOG_SERVICE') private readonly catalogClient: ClientProxy,
        @Inject('WALLET_SERVICE') private readonly walletCleint: ClientProxy,
    ){}

    async createOrder(userId: string, dto: CreateOrderDto){
        const myCart = await this.cartService.getMyCart(userId);
        if(!myCart.cartItems || myCart.cartItems.length === 0 ){
            throw new BadRequestException('Your cart is empty');
        }

        const myAddress = await this.prisma.address.findUnique({
            where: {id: dto.addressId, userId}
        });

        if(!myAddress){
            throw new BadRequestException('Your address not found')
        };

        const variantIds = myCart.cartItems.map((item) => item.productVariantId);
        const variants = await firstValueFrom(
            this.catalogClient
            .send<VariantDetails[]>({cmd: 'get_variants_details'}, {variantIds})
            .pipe(timeout(6000))
        );

        const variantsMap = new Map(variants.map((v) => [v.id, v]));

        let totalAmount = 0;
        for (const item of myCart.cartItems){
            const variant = variantsMap.get(item.productVariantId);

            if(!variant){
                throw new ConflictException(
                    `product variant ${item.productVariantId} is no longer available`
                )
            };

            if(variant.stock < item.quantity){
                throw new ConflictException(`Insufficient stock for: ${variant.sku}`)
            }
            
            totalAmount += Number(variant.price) * item.quantity;
        };

        totalAmount = Math.round(totalAmount * 100) /100;

        const paymentResult = await firstValueFrom(
            this.walletCleint
                .send({cmd: 'charge_wallet'}, { userId, amount: totalAmount})
                .pipe(timeout(10000))
        );

        if(!paymentResult || !paymentResult.succeeded){
            throw new BadRequestException('Payment failed: ' + (paymentResult?.reason || 'unknown error related to payment'));
        }

        try {
            const order = await this.prisma.$transaction(async (tx) => {
                const newOrder = await this.prisma.order.create({
                    data: {
                        userId, 
                        addressId: myAddress.id,
                        totalAmount,
                        orderItems: {
                            createMany: {
                                data: myCart.cartItems.map((item) => {
                                    const variant = variantsMap.get(item.productVariantId)!;
                                    return {
                                        productVariantId: item.productVariantId,
                                        quantity: item.quantity,
                                        priceAtPurchase: variant.price,
                                        skuAtPurchase: variant.sku
                                    };
                                }),
                            },
                        },
                    },
                });

                await tx.cartItem.deleteMany({ where: {cartId: myCart.id}});

                return tx.order.findUnique({
                    where: { id: newOrder.id},
                    include: {orderItems: true, address: true}
                });
            });

            this.catalogClient.emit('order.created', {
                orderId: order.id,
                items: myCart.cartItems.map((item) => ({
                variantId: item.productVariantId,
                quantity: item.quantity
                })),
            });

            return order;
        } catch (dbError: any) {
            this.logger.error(`order db creation failed for user ${userId}.`, dbError);

            this.walletCleint.emit('refound_wallet', {
                userId,
                amount: totalAmount,
                reason: 'Order creation db failure conmensaton '
            });
            throw new InternalServerErrorException('order processing fialed, your money has been rofounded!')
        }
    }


    async getMyOrders(userId: string): Promise<OrderListItems[]>{
        return await this.prisma.order.findMany({
            where: { userId },
            orderBy: {createdAt: 'desc'},
            include: {
                address: true,  
                _count: {
                    select: {orderItems: true}
                },
                orderItems: true
            }
        })
    }


    async getMyOrderDetails(
        userId: string,
        orderId: string
    ): Promise<OrderDetailed>{
        const order = await this.prisma.order.findUnique({
            where: { id: orderId, userId },
            include: {
                address: true,
                orderItems: true
            }
        });

        return order;
    }


    
}
