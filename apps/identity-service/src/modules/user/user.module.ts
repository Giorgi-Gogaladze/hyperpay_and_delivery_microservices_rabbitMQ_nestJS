import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'ORDER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport:  Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
            queue: 'order_queue',
            queueOptions: {
              durable: true
            },
          }
        }),
        inject: [ConfigService],
      },
      {
        name: 'WALLET_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport:  Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
            queue: 'wallet_queue',
            queueOptions: {
              durable: true
            },
          }
        }),
        inject: [ConfigService],
      }
    ])
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
