import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";
import { Transform } from 'class-transformer'

export class CreateCategoryDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    slug: string; 

    @Transform(({value}) => value === 'ture' || value === true)
    @IsBoolean()
    isActive?: boolean;

}
