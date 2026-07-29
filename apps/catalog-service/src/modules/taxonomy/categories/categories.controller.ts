import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from '../../../generated/prisma/client';
import { FileInterceptor } from '@nestjs/platform-express'
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { JwtAuthGuard } from '@app/common';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role, Roles } from '@app/common/decorators/roles.decorator';


@Controller('categories')
export class CategoriesController {
  constructor( private readonly categoriesService: CategoriesService ){}

  @Get()
  async getAllCategories(): Promise<Category[]>{
    return await this.categoriesService.getAllCategories();
  }

  @Get(':id')
  async getCategoryById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Category> {
    return this.categoriesService.getCategoryById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File
  ): Promise<Category>{
    return this.categoriesService.createCategory(dto, file);
  }

  

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Category> {
    return this.categoriesService.updateCategoy(id, dto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.categoriesService.deleteCategory(id);
  }

}
