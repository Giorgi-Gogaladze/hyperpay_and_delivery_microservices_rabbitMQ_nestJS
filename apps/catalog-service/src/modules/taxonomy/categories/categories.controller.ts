import { ConflictException, Controller } from '@nestjs/common';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { Category } from '../../../generated/prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import slugify from 'slugify'

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService, 
  ){}

  async createCategory(dto: CreateCategoryDto, file: Express.Multer.File): Promise<Category>{
    const existingCategory = await this.prisma.category.findFirst({
      where: {name: dto.name},
    });

    if(existingCategory){
      throw new ConflictException(`Category with name ${dto.name} already exist`);
    };

    const categorySlug = slugify(dto.name, {
      lower: true,
      strict: true,
      replacement: '-'
    });

    let thumbnailUrl = null;
    let thumbnailPublicId = null;
    if(file){
      const uploadRes = await this.cloudinaryService.uploadImage(file);
      thumbnailUrl = uploadRes.secure_url;
      thumbnailPublicId = uploadRes.public_id;
    }

    const newCategory = await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        slug: categorySlug,
        thumbnailPublicId,
        thumbnailUrl,
        isActive: dto.isActive ?? true,
      }
    });

    return newCategory;
  }

}
