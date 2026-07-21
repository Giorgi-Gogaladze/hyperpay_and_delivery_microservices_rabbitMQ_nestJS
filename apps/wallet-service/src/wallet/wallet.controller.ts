import { Controller } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

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

      channel.nack(originalMsg, false, false)//თუ შეცდომა მოხდა, ეუბნები RabbitMQ-ს "ვერ დავამუშავე, ისევ რიგში ჩააბრუნე. პარამეტრები: (მესიჯი, multiple, requeue)
    }

  }
}
