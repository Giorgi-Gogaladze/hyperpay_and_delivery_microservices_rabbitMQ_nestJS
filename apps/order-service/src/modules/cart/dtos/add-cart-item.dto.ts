import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from "class-validator";

export class AddCartItemDto {
    @IsUUID()
    @IsNotEmpty()
    productVariantId: string;
    
    @IsInt()
    @Min(1)
    quantity: number;
}