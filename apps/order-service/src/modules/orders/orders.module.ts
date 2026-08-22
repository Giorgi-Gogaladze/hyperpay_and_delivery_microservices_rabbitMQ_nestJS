import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DeliveryFeeService } from './delivery-fee.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, DeliveryFeeService],
  exports: [OrdersService, DeliveryFeeService]
})
export class OrdersModule {}
