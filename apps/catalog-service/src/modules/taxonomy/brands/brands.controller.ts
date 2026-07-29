import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dtos.ts/create-brand.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@app/common';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role, Roles } from '@app/common/decorators/roles.decorator';
import { createImageValidationPipe } from '@app/common/pipes/image-validation.pipe';
import { Brand } from '../../../generated/prisma/client';
import { UpdateBrandDto } from './dtos.ts/update-brand.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async createBrand(
    @Body() dto: CreateBrandDto,
    @UploadedFile(createImageValidationPipe({isRequired: false})) 
    file?: Express.Multer.File
  ){
    return await this.brandsService.createBrand(dto, file)
  }

  @Get()
  async getAllBrands(): Promise<Brand[]> {
    return this.brandsService.getAllBrands();
  }

  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Brand> {
    return this.brandsService.getById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async updateBrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
    @UploadedFile(createImageValidationPipe({isRequired: false})) 
    file?: Express.Multer.File,
  ): Promise<Brand> {
    return this.brandsService.updateBrand(id, dto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteBrand(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.brandsService.deleteBrand(id);
  }


}
