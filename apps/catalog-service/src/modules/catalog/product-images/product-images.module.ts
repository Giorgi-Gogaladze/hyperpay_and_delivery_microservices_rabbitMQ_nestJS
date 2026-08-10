import { Module } from '@nestjs/common';
import { ProductImagesService } from './product-images.service';
import { ProductImagesController } from './product-images.controller';
import { CloudinaryModule } from '../../../shared/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [ProductImagesController],
  providers: [ProductImagesService],
})
export class ProductImagesModule {}
