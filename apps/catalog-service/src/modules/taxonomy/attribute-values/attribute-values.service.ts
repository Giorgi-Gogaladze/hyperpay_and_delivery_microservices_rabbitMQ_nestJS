import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateAttributeValueDto } from './dtos/createAttributeValue.dto';
import { AttributeValue } from '../../../generated/prisma/client';
import { UpdateAttributeValueDto } from './dtos/updateAttributeValue.dto';

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


    async updateAttributeValue(
        id: string,
        dto: UpdateAttributeValueDto
    ): Promise<AttributeValue>{
        const existing = await this.prisma.attributeValue.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(`Attribute value with ID "${id}" not found`);
        }

        if(dto.value !== existing.value){
            const duplicate = await this.prisma.attributeValue.findFirst({
            where: { 
                attributeId: existing.attributeId,
                value: dto.value,
                NOT: {id}   
            },
        });

            if (duplicate) {
                throw new ConflictException(
                    `Value "${dto.value}" already exists for this attribute`,
                );
            };
        };

        return this.prisma.attributeValue.update({
            where: { id },
            data: { value: dto.value },
        });
        
    }



    async deleteAttributeValue(
        attId: string, 
        attValueid: string
    ): Promise<{message: string}>{
       const res = await this.prisma.attributeValue.deleteMany({
            where: {
                id: attValueid,
                attributeId: attId,
            },
       });
       
       if(res.count === 0){
            throw new NotFoundException(
                `Attribute value with ID "${attValueid}" not found for attribute "${attId}"`,
            );
       }

       await this.prisma.attributeValue.delete({
        where: {id: attValueid}
       });

       return {
        message: 'AttributeValue removed successfully'
       }

    }
}
