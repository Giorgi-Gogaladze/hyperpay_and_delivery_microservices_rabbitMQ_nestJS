import { NestFactory } from '@nestjs/core';
import { IdentityServiceModule } from './app.module';
import { createValidationPipe } from '@app/common/pipes/validation-pipe.factory';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(IdentityServiceModule);

  app.useGlobalPipes(createValidationPipe())

  const configService = app.get(ConfigService)
  const port = configService.getOrThrow<number>('IDENTITY_PORT')

  await app.listen(port);
  console.log('Identity service has started')
}
bootstrap();
