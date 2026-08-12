import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Wallet } from '../generated/prisma/client';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor( private readonly prisma: PrismaService ){};

    async createWalletForUser(userId: string): Promise<void>{
       const existing = await this.prisma.wallet.findUnique({
        where: {userId},
       });

       if(existing){
           this.logger.warn('Wallet for this user already exist')
           return;
       }

       await this.prisma.wallet.create({
        data: {userId},
       })

       this.logger.log(`Wallet created for user ${userId}`);
    }


    async findByUserId(userId: string): Promise<Wallet>{
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId, status: 'ACTIVE' },
        });

        if(!wallet){
            throw new NotFoundException('Wallet not found')
        };

        return wallet;
    }


    async closeMyWallet( userId: string){
        const wallet = await this.prisma.wallet.findUnique({
            where: {userId}
        });

        if(!wallet){
            this.logger.warn(`Wallet for user ${userId} not found, skipping closure.`);
        }

        await this.prisma.wallet.update({
            where: {userId},
            data: {
                status: 'CLOSED'
            }
        })
    }
}
          