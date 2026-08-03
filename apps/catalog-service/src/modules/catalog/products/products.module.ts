import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CloudinaryModule } from '../../../shared/cloudinary/cloudinary.module';
import { ViewsModule } from '../../../views/views.module';

@Module({
  imports:[CloudinaryModule, ViewsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
