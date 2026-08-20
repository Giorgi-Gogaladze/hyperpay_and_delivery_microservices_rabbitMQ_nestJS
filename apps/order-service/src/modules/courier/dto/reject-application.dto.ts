import { IsString, IsNotEmpty } from 'class-validator';

export class RejectApplicationDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}