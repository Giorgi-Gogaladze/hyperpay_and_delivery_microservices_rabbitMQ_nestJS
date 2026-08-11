import { Body, Controller, Post } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { Favorites } from '../../generated/prisma/client';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  async addToFavorites(
    @Body() body: { userId: string; productVariantId: string }
  ): Promise<Favorites>{
    const { userId, productVariantId } = body;
    return this.favoritesService.addToFavorites(userId, productVariantId);
  }
}
