import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { evnValidationSchema } from '../config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: evnValidationSchema,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
