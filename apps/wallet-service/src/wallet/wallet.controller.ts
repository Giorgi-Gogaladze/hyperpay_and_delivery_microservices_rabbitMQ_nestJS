import { Controller, Get, Logger, Patch, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { JwtAuthGuard, User } from '@app/common';
import { Wallet } from '../generated/prisma/client';

@Controller('wallet')
export class WalletController {

  private logger = new Logger(WalletController.name)

  constructor(private readonly walletService: WalletService) {}


  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyWallet(@User('id') userId: string): Promise<Wallet>{
    return this.walletService.findByUserId(userId);
  }

  @EventPattern('user.created')
  async handleUserCreatd(
    @Payload() data: {userId: string},
    @Ctx() context: RmqContext //ამით ვეუბნებით, რომ რადგან მეინში noAck: არის ფოლსი, ეუბნება: RabbitMQ, მესიჯი რიგიდან არ წაშალო, სანამ wallet-service ხელით არ დაგიდასტურებს (Ack), რომ ის წარმატებით დამუშავდა
  ){
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.walletService.createWalletForUser(data.userId);
      channel.ack(originalMsg); //ვეუბნები RabbitMQ-ს "ყველაფერმა კარგად ჩაიარა, წაშალე მესიჯი რიგიდან!
    } catch (error: any) {

      console.error('wallet creation failed:', error);

      channel.nack(originalMsg, false, false)//თუ შეცდომა მოხდა, ვეუბნები RabbitMQ-ს "ვერ დავამუშავე, ისევ რიგში ჩააბრუნე. პარამეტრები: (მესიჯი, multiple, requeue)
    }

  }

  @EventPattern('user.deleted')
  async handleUserDeleted(
    @Payload() data: {userId: string},
    @Ctx() context: RmqContext
  ){
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.walletService.closeMyWallet(data.userId);
      channel.ack(originalMsg);
    } catch (error: any) {
      this.logger.error(`Failed to close wallet for user ${data.userId}`, error);

      if(error.code === 'P1001' || error.name === 'PrismaClientInitializationError'){
        channel.nack(originalMsg, false, true)
      }else{ 
        channel.nack(originalMsg, false, false);
      }
    }
  }

  @MessagePattern({ cmd:'get_wallet_balance'})
  async getMyBallance(
    @Payload() data: { userId: string }
  ){
    const wallet = await this.walletService.findByUserId(data.userId);
    return{
      balance: wallet.balance,
      currency: wallet.currency
    }
  }
}
