import { envValidationSchema } from '@app/common/config/env.validation';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AddressModule } from './modules/address/address.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CartModule } from './modules/cart/cart.module';
import { FavoritesModule } from './modules/favorites/favorites.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),
    AddressModule,
    OrdersModule,
    CartModule,
    FavoritesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
