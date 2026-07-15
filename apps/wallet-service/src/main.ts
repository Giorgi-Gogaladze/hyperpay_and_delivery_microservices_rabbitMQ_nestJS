import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { createValidationPipe } from '@app/common';
import { MicroserviceOptions, Transport} from '@nestjs/microservices'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(createValidationPipe());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL as string || 'amqp://localhost:5672'],
      queue: 'wallet_queue',
      queueOptions: {
        durable: true
      },
      noAck: false,
    }
  });

  await app.startAllMicroservices();

  const configService = app.get(ConfigService)
  const port = configService.getOrThrow<number>("WALLET_PORT");

  await app.listen(port);
  console.log("Wallet Service has started")
  console.log("Wallet Rabbitmq has started")

}
bootstrap();
