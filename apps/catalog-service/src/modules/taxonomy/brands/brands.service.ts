import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { CreateBrandDto } from './dtos.ts/create-brand.dto';
import { Brand } from '../../../generated/prisma/client';
import slugify from 'slugify'
import { UpdateBrandDto } from './dtos.ts/update-brand.dto';

@Injectable()
export class BrandsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ){}

    async createBrand(
        dto: CreateBrandDto,
        file?: Express.Multer.File
    ): Promise<Brand>{
        const existing = await this.prisma.brand.findFirst({
            where: {name: dto.name},
        });

        if(existing){
            throw new ConflictException(`Brand with name: ${dto.name} already exist`)
        };

        const brandSlug = slugify(dto.name, {
            strict: true,
            lower: true,
            replacement: '-'
        });

        let logoImg = null;
        let logoPublicId = null;
        if(file){
            const uploadRes = await this.cloudinaryService.uploadImage(file, 'brands');
            logoImg = uploadRes.secure_url;
            logoPublicId = uploadRes.public_id;
        };

        return await this.prisma.brand.create({
            data: {
                name: dto.name,
                slug: brandSlug,
                description: dto.description,
                isActive: dto.isActive ?? true,
                logoImg, 
                logoPublicId
            }
        })        
    }

    
    async getAllBrands(): Promise<Brand[] | []>{
        return await this.prisma.brand.findMany({
            where: {isActive: true},
            orderBy: {createdAt: 'desc'},
            include: {
                _count: {
                    select: {products: true}
                }
            }
        })
    }

    async getById(id: string): Promise<Brand>{
        const brand = await this.prisma.brand.findUnique({
            where: {id},
            include: {
                _count: {
                    select: {products: true}
                }
            }
        });

        if(!brand){
            throw new NotFoundException('Brand not found');
        };
        return brand;
    }

    async updateBrand(
        id: string,
        dto: UpdateBrandDto,
        file?: Express.Multer.File,
    ): Promise<Brand> {
        const existingBrand = await this.prisma.brand.findUnique({
            where: { id },
        });

        if (!existingBrand) {
            throw new NotFoundException('Brand not found');
        }

        let brandSlug = existingBrand.slug;
        let logoImg = existingBrand.logoImg;
        let logoPublicId = existingBrand.logoPublicId;

        if (dto.name && dto.name !== existingBrand.name) {
            const nameTaken = await this.prisma.brand.findFirst({
            where: {
                name: dto.name,
                NOT: { id },
            },
            });

            if (nameTaken) {
            throw new ConflictException(`Brand with name "${dto.name}" already exists`);
            }

            brandSlug = slugify(dto.name, {
            strict: true,
            lower: true,
            replacement: '-',
            });
        }

        if (file) {
            if (logoPublicId) {
            await this.cloudinaryService.deleteImage(logoPublicId);
            }

            const uploadRes = await this.cloudinaryService.uploadImage(file, 'brands');
            logoImg = uploadRes.secure_url;
            logoPublicId = uploadRes.public_id;
        }

        return this.prisma.brand.update({
            where: { id },
            data: {
            ...(dto.name && { name: dto.name, slug: brandSlug }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            logoImg,
            logoPublicId,
            },
        });
    };


    async deleteBrand(id: string): Promise<{message: string}>{
        const existing = await this.prisma.brand.findUnique({
            where: {id},
        });

        if (!existing) {
            throw new NotFoundException(`brand with id: ${id} not found`);
        };

        await this.prisma.brand.delete({
            where: {id},
        });

        if(existing.logoPublicId){
            await this.cloudinaryService.deleteImage(existing.logoPublicId);
        }

        return {message: 'Brand deleted successfully'};
    }


}