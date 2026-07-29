import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';

@Module({
  imports: [CategoriesModule, BrandsModule]
})
export class TaxonomyModule {}
