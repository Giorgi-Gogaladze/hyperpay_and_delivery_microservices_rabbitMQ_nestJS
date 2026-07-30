import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { AttributesModule } from './attributes/attributes.module';

@Module({
  imports: [CategoriesModule, BrandsModule, AttributesModule]
})
export class TaxonomyModule {}
