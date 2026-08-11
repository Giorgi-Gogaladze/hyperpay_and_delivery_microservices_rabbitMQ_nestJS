import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { Favorites } from '../../generated/prisma/client';
import { AddToFavoritesDto } from './dtos/add-to-favorites.dto';
import { JwtAuthGuard, User } from '@app/common';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  async addToFavorites(
    @Body() dto: AddToFavoritesDto,
    @User('id') userId: string,
  ): Promise<Favorites>{
    return this.favoritesService.addToFavorites(userId, dto.productVariantId);
  }


  @Get()
  async getFavorites(
    @User('id') userId: string,
  ): Promise<Favorites[]> {
    return this.favoritesService.getFavorites(userId);
  }

  @Post('clear')
  async clearFavorites(
    @User('id') userId: string,
  ): Promise<{message: string}> {
    return this.favoritesService.clearFavorites(userId);
  }


  @Delete(':productVariantId')
  async removeFavorite(
    @User('id') userId: string,
    @Param('productVariantId') productVariantId: string
  ): Promise<{message: string}> {
    return this.favoritesService.removeFavorite(userId, productVariantId);
  }
}
