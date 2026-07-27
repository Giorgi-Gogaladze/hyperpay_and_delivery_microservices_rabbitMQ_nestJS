import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { User } from '../../../../libs/common/src/decorators/get-current-user.decorator'
import { safeUser } from '@app/common/types/safe-user';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private readonly userService: UserService){}

    @Get('me')
    async getProfile(@User() userId: string): Promise<safeUser>{
        return await this.userService.findById(userId);
    }

    @Patch('me')
    async updateProfile(
    @User('id') userId: string,
    @Body() dto: UpdateUserDto,) {
    return this.userService.updateProfile(userId, dto);
    }
}
