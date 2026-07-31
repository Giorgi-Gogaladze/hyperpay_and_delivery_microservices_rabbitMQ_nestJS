import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateReviewDto {
    @IsOptional()
    @IsNumber()
    @Min(1, {message: 'Rating must be at least 1'})
    @Max(5, {message: 'Rating must be at most 5'})
    rating: number;

    @IsOptional()
    @IsString()
    comment?: string;

}