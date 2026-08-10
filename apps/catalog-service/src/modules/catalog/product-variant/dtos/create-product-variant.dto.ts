import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, Min } from "class-validator";

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
    
}