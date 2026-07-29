import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { CreateBrandDto } from './dtos.ts/create-brand.dto';
import { Brand } from '../../../generated/prisma/client';
import slugify from 'slugify'

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

        if(!existing){
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
        });

        if(!brand){
            throw new NotFoundException('Brand not found');
        };
        return brand;
    }
}