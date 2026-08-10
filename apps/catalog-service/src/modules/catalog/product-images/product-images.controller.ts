import { Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductImagesService } from './product-images.service';
import {  FileInterceptor } from '@nestjs/platform-express';
import { createImageValidationPipe } from '@app/common/pipes/image-validation.pipe';
import { IAddImagesResponse } from '../../../interfaces/add-image-response.interface';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role, Roles } from '@app/common/decorators/roles.decorator';
import { ProductImage } from '../../../generated/prisma/client';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('product-images')
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}


  @Post(':variantId')
  @UseInterceptors(FileInterceptor('files'))
  async uploadImages(
    @Param('variantId', ParseUUIDPipe) variantId: string, 
    @UploadedFiles(createImageValidationPipe({ isRequired: true})) files: Express.Multer.File[]
  ): Promise<IAddImagesResponse>{
    return await this.productImagesService.uploadImages(files, variantId);
  }

  @Get(':variantId')
  async getVariantImages(
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ): Promise<{message: string, data: ProductImage[]}>{
    return await this.productImagesService.getVariantImages(variantId);
  }


  @Patch(':variantId')
  @UseInterceptors(FileInterceptor('files'))
  async updateVariantImages(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @UploadedFiles(createImageValidationPipe({isRequired: true})) files: Express.Multer.File[]
  ): Promise<void>{
    await this.productImagesService.uploadImages(files, variantId);
  }


  @Delete(':variantId')
  async removeVariantImages(
    @Param('variantId', ParseUUIDPipe) variantId: string
  ): Promise<{message: string}>{
    return await this.productImagesService.removeImages(variantId)
  }
}
