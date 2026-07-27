import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { safeUser } from '@app/common/types/safe-user';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
    constructor( private readonly prisma: PrismaService ){}

    async findById(userId: string): Promise<safeUser>{
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
        });

        if(!user){
             throw new NotFoundException('User not found');
        }

        const {password, refreshToken, resetToken, resetTokenExpiry, ...safeUser} = user;
        return safeUser;
    }

    async updateProfile(userId: string, dto: UpdateUserDto): Promise<safeUser>{
        const user = await this.prisma.user.update({
            where: {id: userId},
            data: dto
        });

        const {password, refreshToken, resetToken, resetTokenExpiry, ...safeUser} = user;
        return safeUser;
    }
}
