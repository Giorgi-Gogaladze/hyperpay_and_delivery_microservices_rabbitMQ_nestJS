import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateBrandDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    name: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({value}) => {
        if(value === 'true' || value === true) return true;
        if(value === 'false' || value === false) return false;
        return true;
    })
    isActive?: boolean = true;
}