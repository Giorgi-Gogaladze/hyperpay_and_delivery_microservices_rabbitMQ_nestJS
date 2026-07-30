import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateAttributeDto } from './dtos/create-attribute.dto';
import { Attribute } from '../../../generated/prisma/client';
import { UpdateAttributeDto } from './dtos/update-attribute.dto';

@Injectable()
export class AttributesService {
    constructor(
        private readonly prisma: PrismaService
    ){}

    async createAttribute(dto: CreateAttributeDto): Promise<Attribute>{
        const existing = await this.prisma.attribute.findUnique({
            where: {name: dto.name},
        });

        if(existing){
            throw new ConflictException(`
                Attribute with name: ${dto.name} already exist`
            );
        }
        return await this.prisma.attribute.create({
            data: {
                name: dto.name
            }
        });
    }


    async getAllAttributes(): Promise<Attribute[]>{
        return this.prisma.attribute.findMany({
            orderBy: { createdAt: 'desc'},
            include: {
                attribute_values: {
                    select: {
                        id: true,
                        value: true
                    },
                },
                _count: {
                    select: { attribute_values: true },
                },
            },
        })
    }

    async getById(id: string): Promise<Attribute> {
    const attribute = await this.prisma.attribute.findUnique({
      where: { id },
      include: {
        attribute_values: {
          select: {
            id: true,
            value: true,
          },
        },
      },
    });

    if (!attribute) {
        throw new NotFoundException(`Attribute with id "${id}" not found`);
    }
    return attribute;
    };


    async updateAttribute(
    id: string,
    dto: UpdateAttributeDto,
  ): Promise<Attribute> {
    const existing = await this.prisma.attribute.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Attribute with ID "${id}" not found`);
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.prisma.attribute.findFirst({
        where: {
          name: dto.name,
          NOT: { id },
        },
      });

      if (nameTaken) {
        throw new ConflictException(
          `Attribute with name "${dto.name}" already exists`,
        );
      }
    }

    return this.prisma.attribute.update({
      where: { id },
      data: { name: dto.name },
      include: {
        attribute_values: true,
      },
    });
    }


    async deleteAttribute(id: string): Promise<{ message: string }> {
        const existing = await this.prisma.attribute.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(`Attribute with ID "${id}" not found`);
        }

        await this.prisma.attribute.delete({
            where: { id },
        });

        return { message: 'Attribute deleted successfully' };
    }

    

}
