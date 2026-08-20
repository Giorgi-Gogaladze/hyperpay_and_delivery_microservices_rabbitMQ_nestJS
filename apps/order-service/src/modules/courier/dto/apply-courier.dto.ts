import { ArrayMinSize, IsArray, IsEnum, IsUrl } from "class-validator";
import { VehicleType } from "../../../generated/prisma/enums";

export class ApplyCourierDto{
    @IsEnum(VehicleType)
    vehicleType: VehicleType

    @IsArray()
    @ArrayMinSize(1)
    @IsUrl({}, { each: true })
    documentUrls: string[];
}