import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis'

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider ={
    provide: REDIS_CLIENT,
    useFactory: (configService: ConfigService) => {
        return new Redis({
            port: configService.getOrThrow<number>('REDIS_PORT'),
            host: configService.getOrThrow<string>('REDIS_HOST'),
        });
    },
    inject: [ConfigService]
}

//ვქმინთ რედისის ქლაინეთს