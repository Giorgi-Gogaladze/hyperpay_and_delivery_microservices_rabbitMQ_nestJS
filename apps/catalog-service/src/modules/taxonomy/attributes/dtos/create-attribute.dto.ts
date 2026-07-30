import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateAttributeDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    name: string;

}