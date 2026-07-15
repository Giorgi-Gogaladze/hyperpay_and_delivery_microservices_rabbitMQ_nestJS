import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dtos/register.dto';
import { Role, User } from '../generated/prisma/client';
import * as argon2 from 'argon2'
import * as crypto from 'crypto'
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';

type SafeUser = Omit<User, 'password' | 'refreshToken'>; 

interface IAuthTokens {
    accessToken: string;
    refreshToken: string;
}

interface IAuthResponse {
    user: SafeUser;
    tokens: IAuthTokens;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly Prisma: PrismaService,
        private readonly jwtService: JwtService
    ){}

    async register(dto: RegisterDto): Promise<IAuthResponse>{
        const existingUser = await this.Prisma.user.findUnique({
            where: {email: dto.email},
        });

        if(existingUser){
            throw new ConflictException(`User with email: ${dto.email} already exist!`)
        };

        const hashedPassword: string = await argon2.hash(dto.password);

        const user: User = await this.Prisma.user.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                password: hashedPassword,
                role: Role.USER,
            },
        });

        const tokens: IAuthTokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

        const {password, refreshToken, ...safeUser} = user;
        return {user: safeUser, tokens};
    }



    async login(dto: LoginDto): Promise<IAuthResponse>{
        const user = await this.Prisma.user.findUnique({
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
        const user = await this.Prisma.user.findUnique({
            where: {id: userId}
        });

        if(!user){
            throw new NotFoundException("User not found!")
        };

        await this.Prisma.user.update({
            where: {id: userId},
            data: {
                refreshToken: null,

            }
        })
    }


    async refreshToken(userId: string, refreshToken: string): Promise<IAuthTokens>{
        const user = await this.Prisma.user.findUnique({
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
        const tokerns = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshTokenHash(user.id, tokerns.refreshToken);

        return tokerns;
    }



    private async generateTokens(userId: string, email: string, role: string): Promise<IAuthTokens>{
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
        
        await this.Prisma.user.update({
            where: { id: userId},
            data: { refreshToken: hash}
        })
    }
}
