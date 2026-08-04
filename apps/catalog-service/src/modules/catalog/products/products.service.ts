import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { CreateProductDto } from './dtos/create-product.dto';
import slugify from 'slugify';
import { Prisma, Product } from '../../../generated/prisma/client';
import { ViewsService } from '../../../views/views.service';
import { QueryDto, SortBy } from './dtos/query.dto';
import { PaginatedProductsResponcse } from '../../../interfaces/paginated_Products_response.interface';
import { SortOrder } from '../../../generated/prisma/internal/prismaNamespace';


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


    async getAllProducts(
        queryDto: QueryDto = {},
        isAdmin: boolean = false
    ): Promise<PaginatedProductsResponcse> {
        const {
            brand,
            category,
            limit = 10,
            maxPrice,
            minPrice,
            page = 1,
            search,
            sortBy = SortBy.CREATED_AT,
            sortOrder = SortOrder.desc,
        } = queryDto;

        const where: Prisma.ProductWhereInput = isAdmin ? {} : { isActive: true };

        if (search) {
            where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (category) {
            const isUuid = /^[0-9a-fA-F-]{36}$/.test(category);
            where.category = isUuid ? { id: category } : { slug: category };
        }

        if (brand) {
            const isUuid = /^[0-9a-fA-F-]{36}$/.test(brand);
            where.brand = isUuid ? { id: brand } : { slug: brand };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.basePrice = {
            ...(minPrice !== undefined && { gte: Number(minPrice) }),
            ...(maxPrice !== undefined && { lte: Number(maxPrice) }),
            };
        }

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
            where,
            include: {
                brand: { select: { name: true } },
                category: { select: { name: true } },
                _count: {
                select: { reviews: true },
                },
            },
            orderBy: {
                [sortBy]: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc',
            },
            skip,
            take: limit,
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            data: products,
            meta: {
            total,
            limit,
            page,
            totalPages: Math.ceil(total / limit),
            hasNextPage: skip + products.length < total,
            hasPreviousPage: page > 1, 
            },
        };
    };


    

    async findOne(productId: string, clientIp): Promise<Product>{
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: { 
                variants: {
                    include: {
                        images: true,
                        attributeValues: true
                    }
                }, 
                reviews: true,
                brand: true,
                category: true,
            },
        });

        if (!product) {
            throw new NotFoundException(`product with id ${productId} not found`);
        }

        this.viewsSerice.incrementViews(productId, clientIp);

        return product;
    };

    

}
