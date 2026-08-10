import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { ProductImagesModule } from './product-images/product-images.module';
import { ProductVariantModule } from './product-variant/product-variant.module';

@Module({
  imports: [ProductsModule, ProductImagesModule, ProductVariantModule],
})
export class CatalogModule {}
