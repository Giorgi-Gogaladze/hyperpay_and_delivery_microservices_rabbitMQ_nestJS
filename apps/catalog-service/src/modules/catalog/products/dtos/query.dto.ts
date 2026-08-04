import { Transform, Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export enum SortOrder {
    ASC = 'asc',
    DESC= 'desc',
}

export enum SortBy {
    PRICE = 'price',
    CREATED_AT = 'createdAt',
    VIEWS = 'views',
    NAME = 'name',
    BRAND = 'brand',
    RATING = 'rating'
}

export class QueryDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    page?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    limit?: number;

    @IsOptional()
    @IsString()
    @Transform(({value}) => value?.trim())
    search?: string;

    @IsOptional()
    @IsEnum(SortBy, {
        message: 'Invalid sortBy field. Use: price, rating, createdAt, views, name or brand'
    })
    sortBy?: SortBy = SortBy.CREATED_AT

    @IsOptional()
    @IsEnum(SortOrder, {
        message: 'sortOrder must be either asc or desc'
    })
    sortOrder?: SortOrder = SortOrder.DESC

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1000000)
    @Type(() => Number)
    maxPrice?: number;

}