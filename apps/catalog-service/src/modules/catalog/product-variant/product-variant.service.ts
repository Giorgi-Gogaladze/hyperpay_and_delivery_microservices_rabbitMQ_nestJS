import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateProductVariantDto } from './dtos/create-product-variant.dto';
import { Prisma, ProductVariant } from '../../../generated/prisma/client';
import { UpdateProductVariantDto } from './dtos/update-product-variant.dto';
import { RestockProductVariantDto } from './dtos/restock.dto';

@Injectable()
export class ProductVariantService {
    constructor(
        private readonly prisma: PrismaService
    ){}

    private generateSku(values: string[], prodName: string): string{
        const name = prodName.slice(0, 3).toUpperCase();
        const parts = values.length > 0
        ? values.map((part) => {
           return part.replace(/\s+/g, '').slice(0, 5).toUpperCase()
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

        const selectedValues = await this.prisma.attributeValue.findMany({
            where: {id: { in: dto.attributeValueIds}} 
        });

        const valNames = selectedValues.map(v => v.value).sort();

        const generatedSku = this.generateSku(valNames || [], product.name);

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


    
    async updateProductVariant(
        variantId: string,
        dto: UpdateProductVariantDto,
    ): Promise<ProductVariant> {
        const existingVariant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
        });

        if (!existingVariant) {
        throw new NotFoundException(`Product variant with ID ${variantId} not found`);
        }

        const existingProduct = await this.prisma.product.findUnique({
            where: { id: existingVariant?.productId },
        });

        if (!existingProduct) {
            throw new NotFoundException('Associated product not found');
        }

        let generatedSku = null;

        if (dto.attributeValueIds && dto.attributeValueIds.length > 0) {
            const selectedValues = await this.prisma.attributeValue.findMany({
                where: { id: { in: dto.attributeValueIds } }
            });

            const valNames = selectedValues.map(v => v.value).sort();
            
            generatedSku = this.generateSku(valNames, existingProduct.name);
        }


        const updateData: Prisma.ProductVariantUpdateInput = {
        ...(generatedSku && { sku: generatedSku }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.price !== undefined && { price: new Prisma.Decimal(dto.price) }),
        };

        return await this.prisma.productVariant.update({
            where: { id: variantId },
            data: updateData,
        });
    };



    async deleteProductVariant(variantId: string): Promise<{ message: string }> {
        const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
        });

        if (!variant) {
        throw new NotFoundException(`Product variant with ID ${variantId} not found`);
        }

        await this.prisma.productVariant.delete({
        where: { id: variantId },
        });

        return {
        message: `product variant with sku '${variant.sku}' successfully deleted`,
        };
    };

    

    async restockProductVariant(
        variantId: string,
        dto: RestockProductVariantDto
    ): Promise<ProductVariant>{
        const variant  = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
        });

        if (!variant) {
            throw new NotFoundException(`Product variant with ID ${variantId} not found`);
        }

        return await this.prisma.productVariant.update({
            where: { id: variantId },  
            data: {
                stock: variant.stock + dto.quantity
            }
        })
    }



    async decreaseStock(
        variantId: string, 
        quantity: number
    ): Promise<ProductVariant> {
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
        });

        if (!variant) {
            throw new NotFoundException(`Product variant with ID ${variantId} not found`);
        }

        if(variant.stock < quantity){
            throw new ConflictException(`Insufficient stock for variant ${variant.sku}. Available: ${variant.stock}, requested: ${quantity}`);
        }

        return await this.prisma.productVariant.update({
            where: {id: variantId},
            data: {
                stock: { decrement: quantity}
            }
        })
    }
}
