import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsUUID('4', { message: 'userId must be a valid UUID v4' })
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  street: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  zipCode?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
