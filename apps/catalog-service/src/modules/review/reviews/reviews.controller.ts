import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@app/common';
import { User } from '@app/common/decorators/get-current-user.decorator';
import { Role } from '@app/common/decorators/roles.decorator';
import { Review } from '../../../generated/prisma/client';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviweDto } from './dtos/update-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':productId')
  async createReview(
    @Body() dto: CreateReviewDto,
    @Param('productId', ParseUUIDPipe) productId: string,
    @User('id') userId: string,
  ): Promise<Review> {
    return this.reviewsService.createReview(dto, productId, userId);
  }

  @Patch(':id')
  async updateReview(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() dto: UpdateReviweDto,
  ): Promise<Review> {
    return this.reviewsService.updateReview(reviewId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteReview(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @User('id') userId: string,
    @User('role') role?: string,
  ): Promise<{ message: string }> {
    return this.reviewsService.deleteReview(reviewId, userId, role === Role.ADMIN);
  }
}
