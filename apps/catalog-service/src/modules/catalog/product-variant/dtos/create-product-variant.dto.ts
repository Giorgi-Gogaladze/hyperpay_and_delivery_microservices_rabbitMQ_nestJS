import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class CreateProductVariantDto {
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    @Min(0)
    price: number;

    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    @Min(0)
    stock: number;

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    attributeValueIds?: string[];
    
}