import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CourierService } from './courier.service';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role, Roles } from '@app/common/decorators/roles.decorator';
import { User } from '@app/common';
import { ApplyCourierDto } from './dto/apply-courier.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { CourierApplication, CourierProfile } from '../../generated/prisma/client';
import { IApprovedApplicationResponse } from '../../types/approved-application.interface';

@Controller('courier')
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  apply(
    @User('id') userId: string, 
    @Body() dto: ApplyCourierDto): Promise<CourierApplication> {
    return this.courierService.apply(userId, dto);
  }

  @Get('my-application')
  getMyApplication( userId: string): Promise<CourierApplication> {
    return this.courierService.getMyApplicationStatus(userId);
  }

  @Patch('toggle-active')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  toggleActive(@User('id') userId: string, @Body('isActive') isActive: boolean): Promise<CourierProfile> {
    return this.courierService.toggleActive(userId, isActive);
  }

  @Get('admin/courier-profile')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getProfileByUserId(
    @User('id') userId: string
  ): Promise<CourierProfile>{
    return await this.courierService.getProfileByUserId(userId)
  }


  @Get('my-profile')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getMyProfile(
    @User('id') userId: string
  ): Promise<CourierProfile>{
    return await this.courierService.getMyProfile(userId)
  }



  @Get('admin/pending-applications')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getPendingApplications(): Promise<CourierApplication[]>{
    return this.courierService.getPendingApplications();
  }

  @Get('admin/rejected-applications')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getRejectedApplications(): Promise<CourierApplication[]>{
    return this.courierService.getrejectedApplications();
  }


  @Patch('admin/applications/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Param('id') applicationId: string): Promise<IApprovedApplicationResponse>{
    return this.courierService.approveApplication(applicationId);
  }

  @Patch('admin/applications/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  reject(
    @Param('id') applicationId: string, 
    @Body() dto: RejectApplicationDto): Promise<CourierApplication>{
    return this.courierService.rejectApplication(applicationId, dto);
  }
}
