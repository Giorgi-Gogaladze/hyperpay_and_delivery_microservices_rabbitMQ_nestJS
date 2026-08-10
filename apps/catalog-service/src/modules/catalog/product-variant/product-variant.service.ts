import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateProductVariantDto } from './dtos/create-product-variant.dto';
import { ProductVariant } from '../../../generated/prisma/client';

@Injectable()
export class ProductVariantService {
    constructor(
        private readonly prisma: PrismaService
    ){}

    private genereateSku(values: string[], prodName: string): string{
        const name = prodName.slice(0, 3).toUpperCase();
        const parts = values.map((part) => {
            return part.replace(/\s+/g, '').slice(0, 5).toUpperCase()
        }).join('-');

        const randomSufix = Math.floor(1000 + Math.random() * 9000);
        return (`${name}-${parts}-${randomSufix}`).trim();
    }


    async createProductVariant(
        productId: string,
        dto: CreateProductVariantDto
    ): Promise<ProductVariant>{

    }
}
