import { Transform } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateAttributeValueDto{
    @IsUUID()
    @IsNotEmpty()
    attributeId: string;

    @IsArray()
    @IsString({each: true})
    @IsNotEmpty({each: true})
    @Transform(({value}) => {
        if(typeof value === 'string') return [value.trim()];
        if(Array.isArray(value)) return value.map((v) => typeof v === 'string' ? v.trim() : v);
        return value;
    })
    values: string[];
}