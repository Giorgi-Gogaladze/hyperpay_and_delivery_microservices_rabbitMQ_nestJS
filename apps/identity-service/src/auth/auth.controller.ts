import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService, IAuthResponse } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { User} from '../../../../libs/common/src/decorators/get-current-user.decoratro'
import { Role } from '../generated/prisma/enums';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '@app/common/guards/jwt-refresh.guard';

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



}
