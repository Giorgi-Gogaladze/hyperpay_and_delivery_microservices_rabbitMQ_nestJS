import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createValidationPipe } from '@app/common/pipes/validation-pipe.factory';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(createValidationPipe());
  app.enableCors();

  const configService = app.get(ConfigService)
  const port = configService.getOrThrow<number>("CATALOG_PORT");

  await app.listen(port);
  console.log('Catalog service has started')
}
bootstrap();
