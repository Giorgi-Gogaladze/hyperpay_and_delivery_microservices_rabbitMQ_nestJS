import { NestFactory } from '@nestjs/core';
import { createValidationPipe } from '@app/common/pipes/validation-pipe.factory';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(createValidationPipe())

  const configService = app.get(ConfigService)
  const port = configService.getOrThrow<number>('ORDER_PORT')

  await app.listen(port);
  console.log('Identity service has started')
}
bootstrap();
