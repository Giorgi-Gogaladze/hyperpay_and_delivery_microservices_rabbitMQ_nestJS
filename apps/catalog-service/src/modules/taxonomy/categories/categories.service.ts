import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { Category } from '../../../generated/prisma/client';
import slugify from 'slugify'
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService, 
  ){}

  async createCategory(
    dto: CreateCategoryDto, 
    file?: Express.Multer.File
  ): Promise<Category>{
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
      const uploadRes = await this.cloudinaryService.uploadImage(file, 'categories');
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

  

  async updateCategoy(
    id: string, 
    dto: UpdateCategoryDto,
    file?: Express.Multer.File
  ): Promise<Category>{
    const existing = await this.prisma.category.findUnique({
      where: {id},
    });

    if(!existing){
      throw new NotFoundException('Categoy not found')
    };

    let categorySlug = existing.slug;
    if(dto.name && dto.name !== existing.name){
      const nameTaken = await this.prisma.category.findFirst({
        where: {
          name: dto.name,
          NOT: {id}
        },
      });

      if (nameTaken) {
        throw new ConflictException(`Category with name "${dto.name}" already exists`);
      }

      categorySlug = slugify(dto.name, {
        lower: true,
        replacement: '-',
        strict: true
      });
    };

    let thumbnailUrl = existing.thumbnailUrl;
    let thumbnailPublicId = existing.thumbnailPublicId;

    if(file){
      if(existing.thumbnailPublicId){
        await this.cloudinaryService.deleteImage(existing.thumbnailPublicId);
      }

      const uplaodRes = await this.cloudinaryService.uploadImage(file, 'categories');
      thumbnailUrl = uplaodRes.secure_url;
      thumbnailPublicId = uplaodRes.public_id;
    };

    return this.prisma.category.update({
      where: {id},
      data: {
        ...(dto.name && {name: dto.name, slug: categorySlug}),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        thumbnailPublicId,
        thumbnailUrl
      }
    })

  }


  async getAllCategories(): Promise<Category[]>{
    return this.prisma.category.findMany({
      where: {isActive: true},
      orderBy: { createdAt: 'desc'},
      include: {
        _count: {
          select: {products: true}
        }
      }
    })
  };


  async getCategoryById(id: string): Promise<Category>{
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }
    return category;
  };


  async deleteCategory(id: string): Promise<{message: string}>{
    const category = await this.getCategoryById(id);

    if(category.thumbnailPublicId){
      await this.cloudinaryService.deleteImage(category.thumbnailPublicId);
    }
    
    await this.prisma.category.delete({
      where: {id},
    });

    return { message: `Category "${category.name}" successfully deleted` };
  }
}
