import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Favorites } from '../../generated/prisma/client';

@Injectable()
export class FavoritesService {
    constructor(
        private readonly prisma: PrismaService
    ) {}


    async addToFavorites(userId: string, productVariantId: string):Promise<Favorites>{
        try {
            return await this.prisma.favorites.create({
                data: {
                    userId,
                    productVariantId
                }
            })
        } catch (error: any) {
            if(error.code === 'P2002'){
                throw new ConflictException('This product variant is already in your favorites');
            }
        }
    };
    
    async getFavorites(userId: string): Promise<Favorites[]> {
        return this.prisma.favorites.findMany({
            where: { userId },
        });
    }

    async clearFavorites(userId: string): Promise<{message: string}> {
        await this.prisma.favorites.deleteMany({
            where: { userId },
        });
        return { message: 'All favorites cleared' };
    }


    async removeFavorite(userId: string, productVariantId: string): Promise<{message: string}> {
        await this.prisma.favorites.deleteMany({
            where: { userId, productVariantId },
        });
        return { message: 'Removed from favorites' };
    }

}