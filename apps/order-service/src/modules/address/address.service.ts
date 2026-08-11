import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Address } from '../../generated/prisma/client';
import { Prisma } from '../../generated/prisma/client';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async createAddress(dto: CreateAddressDto): Promise<Address> {
    const existingAddress = await this.prisma.address.findFirst({
      where: {
        userId: dto.userId, 
        street: dto.street,
        city: dto.city,
        zipCode: dto.zipCode,
      },
    });

    if (existingAddress) {
      throw new NotFoundException('Address already exists for this user');
    }

    return await this.prisma.address.create({
      data: dto,
    });
  }

  async updateAddress(id: string, dto: UpdateAddressDto): Promise<Address> {
    try {
      return await this.prisma.address.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Address with id ${id} not found`);
      }
      throw error;
    }
  }

  async deleteAddress(id: string): Promise<Address> {
    try {
      return await this.prisma.address.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Address with id ${id} not found`);
      }
      throw error;
    }
  }
}
