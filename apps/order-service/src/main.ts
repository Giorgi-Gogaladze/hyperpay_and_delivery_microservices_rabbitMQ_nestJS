import { NestFactory } from '@nestjs/core';
import { createValidationPipe } from '@app/common/pipes/validation-pipe.factory';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(createValidationPipe());
  app.enableCors();

  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
      queue: 'order_queue',
      queueOptions: {
        durable: true,
      },
      noAck: false,
    }
  });

  await app.startAllMicroservices();

  const port = configService.getOrThrow<number>('ORDER_PORT')

  await app.listen(port);
  console.log('Order service has started');
  console.log('Order Rmq has started');
}
bootstrap();
