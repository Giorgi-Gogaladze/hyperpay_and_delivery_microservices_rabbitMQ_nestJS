import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from "class-validator";

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    @MinLength(10)
    @MaxLength(500)
    description: string;

    @IsNotEmpty()
    @IsNumber({}, { message: 'basePrice must be a valid number' })
    @Min(0, { message: 'basePrice cannot be negative' })
    @Type(() => Number)
    basePrice: number;


    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === undefined || value === null) return undefined;
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return value;
    })
    isActive?: boolean;

    @IsUUID('4', { message: 'brandId must be a valid UUID v4' })
    @IsNotEmpty()
    brandId: string;

    @IsUUID('4', { message: 'categoryId must be a valid UUID v4' })
    @IsNotEmpty()
    categoryId: string;



}