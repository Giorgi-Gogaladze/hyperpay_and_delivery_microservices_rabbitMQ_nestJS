import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { calculateDistanceKm } from "../../common/distance.utils";

@Injectable()
export class DeliveryFeeService{
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService 
    ){}


    calculateFee( destinationLat: number, destinationLon: number ): {
        fee: number;
        distanceInKm: number;
    }{
        const storeLat = this.configService.getOrThrow<number>('STORE_LATITUDE');
        const storeLon = this.configService.getOrThrow<number>('STORE_LONGITUDE');
        const baseFee = this.configService.getOrThrow<number>('DELIVERY_BASE_FEE');
        const perKmFee = this.configService.getOrThrow<number>('DELIVERY_PER_KM_FEE');


        const distanceKm = calculateDistanceKm(
        storeLat,
        storeLon,
        destinationLat,
        destinationLon,
        );

        const fee = baseFee + perKmFee * distanceKm;

        return {
            fee: Math.round(fee * 100) /100 ,
            distanceInKm: Math.round(distanceKm * 10) /10,
        }
    }
}