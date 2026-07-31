import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { Review } from '../../../generated/prisma/client';
import { UpdateReviweDto } from './dtos/update-review.dto';

@Injectable()
export class ReviewsService {
    constructor(
        private readonly prisma: PrismaService,
    ){}

    async createReview(
        dto: CreateReviewDto, 
        productId: string, 
        userId: string, 
    ): Promise<Review>{
        const existingReview = await this.prisma.review.findFirst({
            where: {
                userId,
                productId
            }
        });

        if(existingReview){
            throw new ConflictException(
                'You already have reviewed that product'
            )
        };

        const review = await this.prisma.review.create({
            data: {
                userId,
                productId,
                rating: dto.rating,
                comment: dto.comment,
            }
        });
        await this.updateAvgRating(productId);
        return review;
    };


    async updateReview(
        reviewId: string,
        dto: UpdateReviweDto
    ): Promise<Review>{
        const existing = await this.prisma.review.findUnique({
            where: {id: reviewId},
        });

        if(!existing){
            throw new NotFoundException(
                'Review not found'
            );
        };

        const review = await this.prisma.review.update({
            where: {id: reviewId},
            data: {
                ...(dto.rating !== undefined && {rating: dto.rating}),
                ...(dto.comment !== undefined && dto.comment !== '' && {comment: dto.comment}),            
            }
        });

        await this.updateAvgRating(existing.productId);

        return review;
    };





    async updateAvgRating(productId: string){
        const review = await this.prisma.review.aggregate({
            where: {productId},
            _avg: {rating: true},
        });

        const avgRating = review._avg.rating || 0;

        await this.prisma.product.update({
            where: {id: productId},
            data: {
                avgRating: Number(avgRating.toFixed(2)),
            },
        });
    }
}
