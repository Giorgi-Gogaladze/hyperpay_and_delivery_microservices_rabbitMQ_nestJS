import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateProductVariantDto } from './dtos/create-product-variant.dto';
import { Prisma, ProductVariant } from '../../../generated/prisma/client';

@Injectable()
export class ProductVariantService {
    constructor(
        private readonly prisma: PrismaService
    ){}

    private genereateSku(values: string[], prodName: string): string{
        const name = prodName.slice(0, 3).toUpperCase();
        const parts = values.length > 0
        ? values.map((part) => {
            part.replace(/\s+/g, '').slice(0, 5).toUpperCase()
        }).join('-') 
        : 'DEFAULT';

        const randomSufix = Math.floor(1000 + Math.random() * 9000);
        return (`${name}-${parts}-${randomSufix}`).trim();
    }


    async createProductVariant(
        productId: string,
        dto: CreateProductVariantDto
    ): Promise<ProductVariant>{
        const product = await this.prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const generatedSku = this.genereateSku(dto.attributeValueIds || [], product.name);

        const isDuplicateSku = await this.prisma.productVariant.findUnique({
            where: { sku: generatedSku}
        });

        if (isDuplicateSku) {
            throw new ConflictException(`Variant with SKU '${generatedSku}' already exists`);
        }

        return await this.prisma.productVariant.create({
          data: {
            productId,
            sku: generatedSku,
            price: new Prisma.Decimal(dto.price),
            stock: dto.stock,
          },
        });
    };


    async getProductVariantById(variantId: string): Promise<ProductVariant> {
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                product: true,
                attributeValues: true,
                images: true,
            },
        }); 

        if (!variant) {
            throw new NotFoundException('Product variant not found');
        }

        return variant;
    }



}
