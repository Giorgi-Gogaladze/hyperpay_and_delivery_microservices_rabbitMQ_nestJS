import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt'
import { AuthStrategy } from './strategies/at.strategy';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    ClientsModule.registerAsync([//კლიენტი, ანუ რომლიც გზავნის მესიჯს(მაგ: wallet_თან)
      {
        name: 'WALLET_SERVICE',   //ეს გვინდა, რომ ამ სახელით ჩავაინჯექთოთ სერვისის კონსტრუქტორში
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [process.env.RABBITMQ_URL as string || 'amqp://localhost:5672'],
            queue: 'wallet_queue',  //იმ ვალეტის ქიუს სახელი, სადაც მესიჯი იგზავნება/ვარდება (რომელშიც უნდა ჩაჯდეს)
            queueOptions: {
              durable: true
            },
          },
        })
      }
    ]),
    JwtModule.register({
      global: true,
    }),
    PassportModule,
    JwtModule.register({})
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthStrategy,
    JwtRefreshStrategy
  ]
})
export class AuthModule {}
