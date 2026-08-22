import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApplyCourierDto } from './dto/apply-courier.dto';
import { CourierApplication, CourierProfile } from '../../generated/prisma/client';
import { profile } from 'console';
import { IApprovedApplicationResponse } from '../../types/approved-application.interface';
import { RejectApplicationDto } from './dto/reject-application.dto';

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


    async getPendingApplications(): Promise<CourierApplication[]>{
        const pendingApps = await this.prisma.courierApplication.findMany({
            where: { status: 'PENDING'},
            orderBy: {createdAt: 'asc'}
        });
        return pendingApps;
   }


   async getrejectedApplications(): Promise<CourierApplication[]>{
        return await this.prisma.courierApplication.findMany({
            where: { status: 'REJECTED'},
            orderBy: {createdAt: 'desc'}
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

        return {
            message: 'Applications is approved', 
            application: updatedApplication, 
            profile: updatedProfile
        }
    })

   }


   async rejectApplication(applicationId: string, dto: RejectApplicationDto): Promise<CourierApplication>{
    const application = await this.prisma.courierApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException(
        `application already ${application.status.toLowerCase()}`,
      );
    };

    return this.prisma.courierApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        rejectionReason: dto.reason,
        reviewedAt: new Date(),
      },
    });
   }


   async getProfileByUserId(userId: string): Promise<CourierProfile>{
        const profile = await this.prisma.courierProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            throw new NotFoundException('You are not an approved courier');
        }

        return profile;
    }


    async toggleActive(userId: string, isActive: boolean): Promise<CourierProfile>{
        const profile = await this.getProfileByUserId(userId);

        return this.prisma.courierProfile.update({
            where: { id: profile.id },
            data: { isActive },
        });
    }


    async getMyProfile(userId: string): Promise<CourierProfile>{
        const profile = await this.prisma.courierProfile.findUnique({
            where: { userId }
        });

        if (!profile) {
            throw new NotFoundException('You are not an approved courier');
        }

        return profile;
    }





}
