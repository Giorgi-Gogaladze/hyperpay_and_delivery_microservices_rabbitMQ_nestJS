import { Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { safeUser } from '@app/common/types/safe-user';
import { UpdateUserDto } from './dtos/update-user.dto';
import { firstValueFrom, timeout } from 'rxjs'

@Injectable()
export class UserService {

    private logger = new Logger(UserService.name);

    constructor( 
        private readonly prisma: PrismaService,
        @Inject('PRDER_SERVICE') private readonly OrderClient: any,
        @Inject('WALLET_SERVICE') private readonly walletClient: any
    ){}

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


    async getUserBalance(userId: string){
        try {
            const walletData = await firstValueFrom<{ balance: number; currency: string }>(
                this.walletClient.send({ cmd: 'get_wallet_balance'}, {userId}).pipe(
                    timeout(5000) //ეს ამატებს 5წამიან შუალედს პასუხამდე, რომ სამუდამოდ არ დაელოდოს
                )
            );
            return {
                userId,
                balance: walletData.balance,
                currency: walletData.currency
            }
        } catch (error: any) {
            if (error.name === 'TimeoutError') {
                throw new ServiceUnavailableException('Wallet service is not responding');
            }
            throw new NotFoundException('Wallet information could not be retrieved');
        }
    }

    async updateProfile(userId: string, dto: UpdateUserDto): Promise<safeUser>{
        const user = await this.prisma.user.update({
            where: {id: userId},
            data: dto
        });

        const {password, refreshToken, resetToken, resetTokenExpiry, ...safeUser} = user;
        return safeUser;
    }

    async deleteUser(userId: string): Promise<{message: string}>{
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.delete({ where: { id: userId } });

        try {
            await Promise.all([
                await this.OrderClient.emit('user.deleted', { userId }),
                await this.walletClient.emit('user.deleted', { userId }),
            ]);
        } catch (error) {
           this.logger.error(`Failed to publish user.deleted event for ${userId}`, error); 
        }

        return {
            message: 'User deleted successfully',
        }
    }
}
