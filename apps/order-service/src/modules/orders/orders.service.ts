import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { CartService } from '../cart/cart.service';
import { firstValueFrom, timeout } from 'rxjs';
import { VariantDetails } from '../../types/product-variant.interface';
import { CreateOrderDto } from './dtos/create-order.dto';
import { OrderDetailed, OrderListItems, OrdersWithDetails } from '../../types/order-tems.type';
import { OrderStatus } from '../../generated/prisma/enums';
import { QueryOrdersDto } from './dtos/query-orders.dto';
import { DeliveryFeeService } from './delivery-fee.service';
import { CourierService } from '../courier/courier.service';


@Injectable()
export class OrdersService {

    private readonly logger = new Logger(OrdersService.name);
    private readonly DELIVERY_FEE = 5.00;


    private readonly VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
        PENDING: ['PROCESSING', 'CANCELLED'],
        PROCESSING: ['ACCEPTED', 'CANCELLED'],
        ACCEPTED: ['PICKED_UP', 'CANCELLED'],
        PICKED_UP: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['DELIVERED', 'CANCELLED'],
        DELIVERED: [],
        CANCELLED: [],
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly cartService: CartService,
        private readonly deliveryFeeServie: DeliveryFeeService,
        private readonly courierService: CourierService,
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


    async getAvailableOrders(){
        return this.prisma.order.findMany({
            where: {status: 'PENDING', courierId: null},
            include: { address: true },
            orderBy: { createdAt: 'asc' },
        })
    }


    async clainOrder(orderId: string, userId: string){
        const courierProfile = await this.courierService.getProfileByUserId(userId);

        if (!courierProfile.isActive) {
            throw new ConflictException('You must be active to claim orders');
        }

        const result = await this.prisma.order.updateMany({
            where: {
                id: orderId,
                status: 'PENDING',
                courierId: null,
            },
            data: {
                courierId: courierProfile.id,
                status: 'ACCEPTED',
            },
        });

        if (result.count === 0) {
            throw new ConflictException(
                'Order is no longer available (already claimed or invalid status)',
            );
        }

        return this.prisma.order.findUnique({
            where: { id: orderId },
            include: { address: true, orderItems: true },
        });
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
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId },
            include: {
                address: true,
                orderItems: true
            }
        });

        if(!order){
            throw new NotFoundException('Order not found')
        }

        return order;
    }


    async cancelMyOrder(
        userId: string,
        orderId: string
    ): Promise<{message: string, refundAmount: number}>{
        const myOrder = await this.prisma.order.findFirst({
            where: {id: orderId, userId},
            include: {orderItems: true},
        });

        if(!myOrder){
            throw new NotFoundException('order not found');
        }

        if(myOrder.status === OrderStatus.CANCELLED){
            throw new ConflictException('Order is already canceled');
        }

        if(myOrder.status === OrderStatus.DELIVERED){
            throw new ConflictException('DEleivered order cant be canceled');
        }

        let refundAmount = Number(myOrder.totalAmount);
        let cancellationNote = 'Full refound issued';

        if(myOrder.status === OrderStatus.SHIPPED){
            const deliveryFee = this.DELIVERY_FEE;
            if(refundAmount < deliveryFee){
                refundAmount = 0;
                cancellationNote = 'Order cancelled while in transit. Refund depleted by courier trip fee.'
            }else{
                refundAmount -= deliveryFee;
                cancellationNote = `order canceled while in transit. Courier fee of Gel  ${deliveryFee.toFixed(2)} deducted from refound.`
            }
        };

            const updatedOrder = await this.prisma.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.CANCELLED },
            });

            this.catalogClient.emit('order.canceled', {
                orderId: myOrder.id,
                items: myOrder.orderItems.map((item) => ({
                    productVariantId: item.productVariantId,
                    quantity: item.quantity
                }))
            });

            if(refundAmount > 0){
                this.walletCleint.emit('wallet.refound', {
                    userId: myOrder.userId,
                    amount: refundAmount,
                    currency: myOrder.currency,
                    reason: cancellationNote
                })
            }

        return { message: 'Order cancelled successfully', refundAmount };    
    }


    async getAllOrders(query: QueryOrdersDto): Promise<OrdersWithDetails>{
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const [orders, total] =  await this.prisma.$transaction([
            this.prisma.order.findMany({
                where: query.status ? {status: query.status} : undefined,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {createdAt:  'desc'},
                include: { address: true, _count: {select: {orderItems: true}}}
            }),
            this.prisma.order.count({
                where: query.status ? {status: query.status} : undefined,
            }),
        ]);

        return {
            data: orders,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }



    async updateOrderStatu(orderId: string, newStatus: OrderStatus){
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const allowedNext = this.VALID_TRANSITIONS[order.status];

        if(!allowedNext.includes(newStatus)){
            throw new ConflictException(`cannot transition order from ${order.status} to ${newStatus}`);
        }

        return this.prisma.order.update({
            where: {id: orderId},
            data: { status: newStatus},

        })
    }


    async markDelivered(orderId: string, courierId: string){
        const order = await this.prisma.order.findFirst({
            where: {id: orderId, courierId: courierId, status: 'PROCESSING'},
            include: {address: true},
        });

        if (!order) {
            throw new NotFoundException('Order not found, not assigned to you, or not in correct status',);
        }

        const {distanceInKm, fee} = this.deliveryFeeServie.calculateFee(
            order.address.latitude,
            order.address.longitude,
        );

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'DELIVERED' },
        });

        const courierProfile = await this.prisma.courierProfile.findUnique({
            where: { id: courierId },
        });

        this.walletCleint.emit('wallet.payout', {
            userId: courierProfile!.userId,
            amount: fee,
            currency: order.currency,
            reason: `Delivery payout for order ${order.id} (${distanceInKm} km)`,
        });

        return { order: updatedOrder, deliveryFee: fee, distanceInKm };
    }


    async markPickedUp(orderId: string, userId: string) {
        const courierProfile = await this.courierService.getProfileByUserId(userId);

        const order = await this.prisma.order.findFirst({
            where: { id: orderId, courierId: courierProfile.id, status: 'ACCEPTED' },
        });

        if (!order) {
            throw new NotFoundException(
                'Order not found, not assigned to you, or not in correct status',
            );
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'PICKED_UP' },
        });
    }

}
