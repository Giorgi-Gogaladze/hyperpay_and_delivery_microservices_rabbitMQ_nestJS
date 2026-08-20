import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApplyCourierDto } from './dto/apply-courier.dto';
import { CourierApplication } from '../../generated/prisma/client';
import { profile } from 'console';
import { IApprovedApplicationResponse } from '../../types/approved-application.interface';

@Injectable()
export class CourierService {
    constructor( private readonly prisma: PrismaService){}

    async apply(userId: string, dto: ApplyCourierDto): Promise<CourierApplication>{
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


    async getMyApplicationStatus(userId: string): Promise<CourierApplication>{
        const application = await this.prisma.courierApplication.findFirst({
            where: { userId},
            orderBy: { createdAt: 'desc'}
        });

        if(!application){
            throw new NotFoundException('No application found');
        }

        return application;
    }



    async getpendingApplications(){
        const pendingApps = await this.prisma.courierApplication.findMany({
            where: { status: 'PENDING'},
            orderBy: {createdAt: 'asc'}
        });
   }

   async approveApplication(applicationId: string): Promise<IApprovedApplicationResponse>{
    const application = await this.prisma.courierApplication.findUnique({
        where: {id: applicationId},
    });

    if(!application){
        throw new NotFoundException('Application not found')
    };

    if(application.status = 'APPROVED'){
        throw new ConflictException('Application is already approved')
    }

    return this.prisma.$transaction(async (tx) => {
        const updatedApplication = await tx.courierApplication.update({
            where: {id: applicationId},
            data: {
                status: 'APPROVED'
            }
        });

        const updatedProfile = await this.prisma.courierProfile.create({
            data: {
                userId: application.userId,
                vehicleType: application.vehicleType,
                applicationId: application.id
            }
        })

        return {application: updatedApplication, profile: updatedProfile}
    })

   }


}
