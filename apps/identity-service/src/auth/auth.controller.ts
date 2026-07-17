import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService, IAuthResponse } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { User} from '../../../../libs/common/src/decoratros/get-current-user.decoratro'
import { Role } from '../generated/prisma/enums';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

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

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@User('id') userId: string): Promise<void>{
        return await this.authService.logout(userId);
    }

    @UseGuards(JwtRefreshStrategy)
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refresh(@Req() req: Request){
        const payload = req.user as {id: string, email: string, role: Role, refreshToken: string};
        return this.authService.refreshToken(payload.id, refreshToken)
    }



}
