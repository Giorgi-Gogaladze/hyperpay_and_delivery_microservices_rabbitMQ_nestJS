import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApplyCourierDto } from './dto/apply-courier.dto';

@Injectable()
export class CourierService {
    constructor( private readonly prisma: PrismaService){}

    async apply(userId: string, dto: ApplyCourierDto){
        const existingPending = await this.prisma.courierApplication.findFirst({
            where: {
                userId,
                status: 'PENDING'
            }
        });

        if(existingPending){
            throw new ConflictException('you already have a pending application')
        }

        const existingProifle = await this.prisma.courierProfile.findUnique({
            where: { userId}
        })

        if(existingProifle){
            throw new ConflictException('You are already an approved courier');
        }

        return await this.prisma.courierApplication.create({
            data: {
                userId, 
                vehicleType: dto.vehicleType,
                documentUrls: dto.documentUrls
            }
        })

    }
}
