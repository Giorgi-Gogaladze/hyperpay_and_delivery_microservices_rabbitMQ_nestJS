import { envValidationSchema } from '@app/common/config/env.validation';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    TaxonomyModule,
    CatalogModule,
    ReviewsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
