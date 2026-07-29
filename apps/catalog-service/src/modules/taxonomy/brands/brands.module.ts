import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { CloudinaryModule } from '../../../shared/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService]
})
export class BrandsModule {}
