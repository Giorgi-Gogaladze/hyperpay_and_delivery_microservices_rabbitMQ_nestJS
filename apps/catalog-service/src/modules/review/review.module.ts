import { Module } from '@nestjs/common';
import { ReviewsModule } from './reviews/reviews.module';
import { ReviewsService } from './reviews/reviews.service';


@Module({
  imports: [ReviewsModule],
  exports: [ReviewsService]
})
export class ReviewModule {}
