import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Ip, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { QueryDto } from './dtos/query.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createImageValidationPipe } from '@app/common/pipes/image-validation.pipe';
import { JwtAuthGuard } from '@app/common';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role, Roles } from '@app/common/decorators/roles.decorator';
import { PaginatedProductsResponcse } from '../../../interfaces/paginated_Products_response.interface';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async createProduct(
    @Body() dto: CreateProductDto,
    @UploadedFile(createImageValidationPipe()) file?: Express.Multer.File,
  ): Promise<any> {
    return await this.productsService.createProduct(dto, file);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getProductsForAdmin(
    @Query() queryDto: QueryDto,
  ): Promise<PaginatedProductsResponcse> {
    return this.productsService.getAllProducts(queryDto, true);
  }

  @Get()
  async getAllProducts(
    @Query() queryDto: QueryDto,
  ): Promise<PaginatedProductsResponcse> {
    return this.productsService.getAllProducts(queryDto);
  }

  @Get(':id/related')
  async getRelatedProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Number(limit);
    const take = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 4;
    return this.productsService.findRelatedProducts(id, take);
  }

  @Get(':id')
  async getProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Ip() ip: string,
  ): Promise<any> {
    return this.productsService.findOne(id, ip);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile(createImageValidationPipe({ isRequired: false }))
    file?: Express.Multer.File,
  ): Promise<any> {
    return this.productsService.updateProduct(id, dto, file);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async toggleActiveStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<any> {
    return this.productsService.toggleActiveStatus(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteProduct(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.productsService.deleteProduct(id);
  }
}
