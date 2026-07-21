import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}
          