import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { AttributesModule } from './attributes/attributes.module';
import { AttributeValuesModule } from './attribute-values/attribute-values.module';

@Module({
  imports: [CategoriesModule, BrandsModule, AttributesModule, AttributeValuesModule]
})
export class TaxonomyModule {}
