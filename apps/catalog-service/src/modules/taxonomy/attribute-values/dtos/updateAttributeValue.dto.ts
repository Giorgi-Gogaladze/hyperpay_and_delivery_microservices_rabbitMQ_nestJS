import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAttributeValueDto {
  @IsString()
  @IsNotEmpty()
  value: string;
}