import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { CreateProductDto } from './dtos/create-product.dto';
import slugify from 'slugify';
import { Product } from '../../../generated/prisma/client';
import { ViewsService } from '../../../views/views.service';

@Injectable()
export class ProductsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly viewsSerice: ViewsService,
        private readonly cloudinaryService: CloudinaryService,
    ){}

    async createProduct(
        dto: CreateProductDto,
        file?: Express.Multer.File
    ): Promise<Product>{
        const [existingProduct, brand, category] = await Promise.all([
            this.prisma.product.findFirst({where: {name: dto.name}}),
            this.prisma.product.findFirst({where: {categoryId: dto.categoryId}}),
            this.prisma.product.findFirst({where: {brandId: dto.brandId}}),
        ]);

        if (existingProduct) throw new ConflictException('Product name already exists');
        if (!brand) throw new NotFoundException
        ('Brand not found');
        if (!category) throw new NotFoundException('Category not found');

        const slug = slugify(dto.name, {
            lower: true,
            strict: true,
            replacement: '-'
        });

        let thumbnailUrl = null;
        let thumbnailPublicId = null;
        if(file){
            const uplaodResult = await this.cloudinaryService.uploadImage(file, 'products');
            thumbnailUrl = uplaodResult.secure_url;
            thumbnailPublicId = uplaodResult.public_id;
        };

        const product = await this.prisma.product.create({
            data: {
                name: dto.name, 
                description: dto.description,
                basePrice: dto.basePrice,
                isActive: dto.isActive ?? true,
                brandId: dto.brandId,
                categoryId: dto.categoryId,
                slug,
                thumbnailUrl,
                thumbnailPublicId,
                views: 0,
                avgRating: 0,
                reviewCount: 0,
                discountPercent: 0,
            },
            include: {
                brand: true,
                category: true,
            }
        });
        return product;
    }


    async getAllProducts():Promise<Product[] | []>{
    }


    async findOne(productId: string, clientIp): Promise<Product>{
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: { variants: true, images: true },
        });

        if (!product) {
            throw new NotFoundException(`product with id ${productId} not found`);
        }

        this.viewsSerice.incrementViews(productId, clientIp);

        return product;
    };

    

}
