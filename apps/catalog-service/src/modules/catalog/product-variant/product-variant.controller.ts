import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ProductVariantService } from './product-variant.service';
import { CreateProductVariantDto } from './dtos/create-product-variant.dto';
import { UpdateProductVariantDto } from './dtos/update-product-variant.dto';
import { RestockProductVariantDto } from './dtos/restock.dto';
import { ProductVariant } from '../../../generated/prisma/client';

@Controller('product-variant')
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @Post(':productId')
  async createProductVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateProductVariantDto,
  ): Promise<ProductVariant>{
    return this.productVariantService.createProductVariant(productId, dto);
  }

  @Get(':id')
  async getProductVariantById(@Param('id', ParseUUIDPipe) id: string): Promise<ProductVariant>{
    return this.productVariantService.getProductVariantById(id);
  }

  @Patch(':id')
  async updateProductVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    return this.productVariantService.updateProductVariant(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteProductVariant(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ message: string }> {
    return this.productVariantService.deleteProductVariant(id);
  }

  @Patch(':id/restock')
  async restockProductVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestockProductVariantDto,
  ): Promise<ProductVariant> {
    return this.productVariantService.restockProductVariant(id, dto);
  }

  @Patch(':id/decrease-stock')
  async decreaseStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
  ): Promise<ProductVariant> {
    return this.productVariantService.decreaseStock(id, quantity);
  }
}
