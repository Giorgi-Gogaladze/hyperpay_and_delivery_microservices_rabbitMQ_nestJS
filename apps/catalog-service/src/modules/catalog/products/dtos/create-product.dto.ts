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
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    basePrice: number;


    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return true;
    })
    isActive?: boolean;

    @IsUUID()
    @IsNotEmpty()
    brandId: string;

    @IsUUID()
    @IsNotEmpty()
    categoryId: string;



}