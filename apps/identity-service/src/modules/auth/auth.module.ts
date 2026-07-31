import { Inject, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt'
import { JwtStrategy } from '@app/common'; 
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ClientsModule.registerAsync([//კლიენტი, ანუ რომლიც გზავნის მესიჯს(მაგ: wallet_თან)
      {
        name: 'WALLET_SERVICE',   //ეს გვინდა, რომ ამ სახელით ჩავაინჯექთოთ სერვისის კონსტრუქტორში
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
            queue: 'wallet_queue',  //იმ ვალეტის ქიუს სახელი, სადაც მესიჯი იგზავნება/ვარდება (რომელშიც უნდა ჩაჯდეს)
            queueOptions: {
              durable: true
            },
          },
        }),
        inject: [ConfigService],
      }
    ]),
    JwtModule.register({
      global: true,
    }),
    PassportModule,
    JwtModule.register({}),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
  ]
})
export class AuthModule {}
