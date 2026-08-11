import { IsNotEmpty, IsString, isString, IsUUID } from "class-validator";

export class AddToFavoritesDto {
    
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    productVariantId: string;
}