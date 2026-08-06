import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { CreateProductDto } from './dtos/create-product.dto';
import slugify from 'slugify';
import { Prisma, Product } from '../../../generated/prisma/client';
import { ViewsService } from '../../../views/views.service';
import { QueryDto, SortBy } from './dtos/query.dto';
import { PaginatedProductsResponcse } from '../../../interfaces/paginated_Products_response.interface';
import { SortOrder } from '../../../generated/prisma/internal/prismaNamespace';
import { UpdateProductDto } from './dtos/update-product.dto';
import { IProductWithNames } from '../../../interfaces/product-with-names.interface';

@Injectable()
export class ProductsService {

    private readonly logger = new Logger(ProductsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly viewsSerice: ViewsService,
        private readonly cloudinaryService: CloudinaryService,
    ){}


    async createProduct(
        dto: CreateProductDto,
        file?: Express.Multer.File
    ): Promise<any>{
        const [existingProduct, brand, category] = await Promise.all([
            this.prisma.product.findFirst({where: {name: dto.name}}),
            this.prisma.category.findFirst({where: {id: dto.categoryId}}),
            this.prisma.brand.findFirst({where: {id: dto.brandId}}),
        ]);

        if (existingProduct) throw new ConflictException('Product name already exists');
        if (!brand) throw new NotFoundException('Brand not found');
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




    async findOne(productId: string, clientIp: string): Promise<Product>{
        const product = await this.prisma.product.findFirst({
            where: { 
                id: productId,
                isActive: true,
            },
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



    async updateProduct(
        id: string,
        dto: UpdateProductDto,
        file?: Express.Multer.File
    ): Promise<IProductWithNames>{
        const [currentProduct, existingProduct] = await Promise.all([
            this.prisma.product.findUnique({ where: {id}}),
            dto.name ? this.prisma.product.findFirst({where: {name: dto.name}}) : Promise.resolve(null),
        ]);

        if(!currentProduct){
            throw new NotFoundException(`product with id ${id} not found`);
        }

        if(existingProduct && existingProduct.id !== id){
            throw new ConflictException(`product with name ${dto.name} already exist `);
        }

        if (dto.brandId) {
            const brand = await this.prisma.brand.findUnique({ where: { id: dto.brandId } });
            if (!brand) throw new NotFoundException('Brand not found');
        }

        if (dto.categoryId) {
            const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
            if (!category) throw new NotFoundException('Category not found');
        }

        let newSlug: string | null = null;
        if(dto.name){
            newSlug = slugify(dto.name, {
                lower: true,
                strict: true,
                replacement:'-'
            });
        }

        let thumbnailUrl = currentProduct.thumbnailUrl;
        let thumbnailPublicId = currentProduct.thumbnailPublicId;

        if(file){
            const uploadResult = await this.cloudinaryService.uploadImage(file, 'products/thumbnails');
        

        if(currentProduct.thumbnailPublicId){
            this.cloudinaryService.deleteImage(currentProduct.thumbnailPublicId).catch((err) => {
                this.logger.error(`failed to delete old thumbnail: ${currentProduct.thumbnailPublicId}`, err)
            });
        };

            thumbnailPublicId = uploadResult.public_id;
            thumbnailUrl = uploadResult.secure_url;
        };

        const updatedProduct = await this.prisma.product.update({
            where: {id},
            data: {
                ...dto,
                ...(newSlug && { slug: newSlug }),
                thumbnailUrl,
                thumbnailPublicId,
            },
            include: {
                brand: {
                    select: { name: true},
                },
                category: {
                    select: {name: true}
                },
            }
        });

        return updatedProduct
    }

    async toggleActiveStatus(productId: string): Promise<Product>{
        const product = await this.prisma.product.findUnique({ where: {id: productId}});
        if(!product) throw new NotFoundException('Product not found');

        return await this.prisma.product.update({
            where: {id: productId},
            data: {
                isActive: !product.isActive
            }
        })
    }


    async findRelatedProducts(
        productId: string,
        limit: number = 4,
    ): Promise<Product[]>{
        const currentProduct = await this.prisma.product.findUnique({
            where: {id: productId},
            select: {brandId: true, categoryId: true}
        });

        if (!currentProduct) {
            throw new NotFoundException(`Product with ID ${productId} not found`);
        }

        const sameCategoryProducts = await this.prisma.product.findMany({
            where: {
                categoryId: currentProduct.categoryId,
                id: {not: productId},
                isActive: true
            },
            take: limit,
            include: {
                brand: {select: {name: true}},
                category: {select: {name: true}}
            },
            orderBy: {
                views: 'desc'
            }
        });

        if (sameCategoryProducts.length >= limit) {
            return sameCategoryProducts;
        }

        const existingIds = [productId, ...sameCategoryProducts.map((p) => p.id)];
        const remainingLimit = limit - sameCategoryProducts.length;

        const sameBrandProducts = await this.prisma.product.findMany({
            where: {
                brandId: currentProduct.brandId,
                id: { notIn: existingIds }, 
                isActive: true,
            },
            take: remainingLimit,
            include: {
                brand: { select: { name: true } },
                category: { select: { name: true } },
            },
            orderBy: {
                views: 'desc',
            },
        });

        return [...sameCategoryProducts, ...sameBrandProducts];
    }


    async deleteProduct(
        productId: string
    ): Promise<{message: string}>{
        const product = await this.prisma.product.findFirst({
            where: {id: productId},
            include: {
                variants: {
                    include: {
                        images: true
                    }
                }
            }
        });

        if(!product){
            throw new NotFoundException('Product not found');
        }

        const publidIdsToDelete: string[] = [];
        
        if(product.thumbnailPublicId){
            publidIdsToDelete.push(product.thumbnailPublicId);
        }

        for(const variant of product.variants){
            if(variant.images && variant.images.length > 0){
                for(const img of variant.images){
                    if(img.imagePublicId){
                        publidIdsToDelete.push(img.imagePublicId)
                    }
                }
            }
        };

        await this.prisma.product.delete({
            where: { id: productId },
        });

        if(publidIdsToDelete.length > 0){
            this.cloudinaryService.deleteFiles(publidIdsToDelete).catch((error: any) => {
                this.logger.log(`failed to delete cloudinary images for product ${productId}`, error)
            });
        }
        
        return { message: 'product and associated variant_images deleted successfully' };
        
    }
    

}
