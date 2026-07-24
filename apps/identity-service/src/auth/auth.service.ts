import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dtos/register.dto';
import { Role, User } from '../generated/prisma/client';
import * as argon2 from 'argon2'
import * as crypto from 'crypto'
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';
import { ClientProxy } from '@nestjs/microservices';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { retry } from 'rxjs';

export type SafeUser = Omit<User, 'password' | 'refreshToken'>; 

export interface IAuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface IAuthResponse {
    user: SafeUser;
    tokens: IAuthTokens;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        @Inject('WALLET_SERVICE') private readonly walletClient: ClientProxy,
    ){}

    async register(dto: RegisterDto): Promise<IAuthResponse>{
        const existingUser = await this.prisma.user.findUnique({
            where: {email: dto.email},
        });

        if(existingUser){
            throw new ConflictException(`User with email: ${dto.email} already exist!`)
        };

        const hashedPassword: string = await argon2.hash(dto.password);

        const user: User = await this.prisma.user.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                password: hashedPassword,
                role: Role.USER,
            },
        });

        this.walletClient.emit('user.created', {  //გაგზავნის მესიჯს wallet_ის queue_ში. user.created არის ივენთის სახელი, რომლითაც ვოლეტი ამოითებს ამ მესიჯს და ფეილოუდს ქიუდან
            userId: user.id,
        })

        const tokens: IAuthTokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

        const {password, refreshToken, ...safeUser} = user;
        return {user: safeUser, tokens};
    }



    async login(dto: LoginDto): Promise<IAuthResponse>{
        const user = await this.prisma.user.findUnique({
            where: {email: dto.email}
        });

        if(!user){
            throw new NotFoundException("Incorrect password or email")
        };

        const passwordMatches = await argon2.verify(user.password, dto.password);

        if(!passwordMatches){
            throw new UnauthorizedException('Incorrect password or email')
        };

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

        const {password, refreshToken, ...safeUser} = user;
        return {user: safeUser, tokens};

    }





    async logout(userId: string): Promise<void>{
        const user = await this.prisma.user.findUnique({
            where: {id: userId}
        });

        if(!user){
            throw new NotFoundException("User not found!")
        };

        await this.prisma.user.update({
            where: {id: userId},
            data: {
                refreshToken: null,

            }
        })
    }


    async refreshToken(userId: string, refreshToken: string): Promise<IAuthTokens>{
        const user = await this.prisma.user.findUnique({
            where: {id: userId}
        });

        if(!user || !user.refreshToken){
            throw new ForbiddenException('Access denied')
        }

        const hashedRt = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const rtMatches = hashedRt === user.refreshToken;

        if (!rtMatches) {
            throw new ForbiddenException('Access Denied');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

        return tokens;
    }



    private async generateTokens(userId: string, email: string, role: Role): Promise<IAuthTokens>{
        const payload = {sub: userId, email, role};

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: '30m',
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: '7d',
            }),
        ]);
        return {accessToken, refreshToken};
    }


    private async updateRefreshTokenHash(
        userId: string,
        refreshToken: string
    ): Promise<void>{
        const hash: string = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');
        
        await this.prisma.user.update({
            where: { id: userId},
            data: { refreshToken: hash}
        })
    }


    async forgotPassword(dto: ForgotPasswordDto): Promise<{message: string}>{
        const user = await this.prisma.user.findUnique({
            where: {email: dto.email}
        });

        if(!user){
            return {message: `If that email is registered, you'll get a link`}
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

        await this.prisma.user.update({
            where: {id: user.id},
            data: {
                resetToken: hashedToken,
                resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
            },
        });

        await this.mailService.sendPasswordResetEmail(user.email, rawToken);
         return {message: `If that email: ${dto.email} is registered, you'll get a link`}
    };


    async resetPassword(dto: ResetPasswordDto): Promise<{message: string}>{
        const hashedToken = crypto
            .createHash('sha256')
            .update(dto.token)
            .digest('hex')

        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if(!user){
            throw new BadRequestException('The link is outdated or incorrect')
        };

        const hashedPassword = await argon2.hash(dto.newPassword);

        await this.prisma.user.update({
            where: {id: user.id},
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
                refreshToken: null,
            },
        });

        return {message: 'Password changed successfully'};
    }
}
