import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { JwtAuthGuard, User } from '@app/common';
import { Wallet } from '../generated/prisma/client';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}


  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyWallet(@User('id') userId: string): Promise<Wallet>{
    return this.walletService.findByUserId(userId);
  }

  @EventPattern('user.created')
  async handleUserCreatd(
    @Payload() data: {userId: string},
    @Ctx() context: RmqContext //ამით ვეუბნებით, რომ რადნა მეინში noAck: არის ფოლსი, ეუბნება: RabbitMQ, მესიჯი რიგიდან არ წაშალო, სანამ wallet-service ხელით არ დაგიდასტურებს (Ack), რომ ის წარმატებით დამუშავდა
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
}
