import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class RestockProductVariantDto {
    @IsInt()
    @Type(() => Number)
    @Min(1, { message: 'Quantity must be at least 1' })
    quantity: number;
}