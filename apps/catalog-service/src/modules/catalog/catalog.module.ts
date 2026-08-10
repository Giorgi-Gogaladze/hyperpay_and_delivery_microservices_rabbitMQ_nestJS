import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { ProductImagesModule } from './product-images/product-images.module';

@Module({
  imports: [ProductsModule, ProductImagesModule],
})
export class CatalogModule {}
