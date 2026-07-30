import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateAttributeValueDto } from './dtos/createAttributeValue.dto';

@Injectable()
export class AttributeValuesService {
    constructor(private readonly prisma: PrismaService){}

    async createAttributeValues(
        dto: CreateAttributeValueDto
    ): Promise<{ message: string; count: number }>{
        
        const attribute = await this.prisma.attribute.findUnique({
        where: { id: dto.attributeId },
        });

        if (!attribute) {
        throw new NotFoundException(
            `Attribute with ID "${dto.attributeId}" not found`,
            );
        };

        const recordToCreate = dto.values.map((val) => ({
            attributeId: dto.attributeId,
            value: val
        }));

        const res = await this.prisma.attributeValue.createMany({
            data: recordToCreate,
            skipDuplicates: true,
        });

        return {
            message: `${res.count} attribute value(s) created successfully`,
            count: res.count
        }
    }
}
