import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '@app/common';

@Module({
  imports: [PrismaModule],
  controllers: [WalletController],
  providers: [
    WalletService,
    JwtStrategy
  ],
})
export class WalletModule {}
