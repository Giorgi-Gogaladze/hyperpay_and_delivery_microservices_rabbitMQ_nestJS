import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService, IAuthResponse } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { User} from '../../../../libs/common/src/decorators/get-current-user.decorator'
import { Role } from '../generated/prisma/enums';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '@app/common/guards/jwt-refresh.guard';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @Post('register')
    async register( @Body() dto: RegisterDto ): Promise<IAuthResponse>{
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login( @Body() dto: LoginDto): Promise<IAuthResponse>{
        return this.authService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@User('id') userId: string): Promise<void>{
        return await this.authService.logout(userId);
    }

    @UseGuards(JwtRefreshGuard)
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refresh(@User() user: any){
        const payload = user as {id: string, email: string, role: Role, refreshToken: string};
        return this.authService.refreshToken(payload.id, user.refreshToken);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ResetPasswordDto){
        return this.authService.resetPassword(dto);
    }

}
