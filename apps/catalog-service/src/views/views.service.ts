import { Inject, Injectable, Logger } from "@nestjs/common";
import { REDIS_CLIENT } from "../redis/redis.provider";
import Redis from "ioredis";
import { PrismaService } from "../../prisma/prisma.service";
import { Cron, CronExpression} from '@nestjs/schedule'

@Injectable()
export class ViewsService{
    private readonly logger = new Logger(ViewsService.name);

    constructor(
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        private readonly prisma: PrismaService
    ){}

    async incrementViews(productId: string, ip: string): Promise<void>{
        const lockKey = `view-lock:${productId}:${ip}`;

        try {
            const wasSet = await this.redis.set(lockKey, '1', 'EX', 3600, 'NX');
            if(wasSet === 'OK'){
                await this.redis.incr(`product:views:${productId}`);
                this.logger.log(`View counted for product ${productId} from IP ${ip}`);
            }else{
                this.logger.debug(`Duplicate view ignored for product ${productId} from IP ${ip}`);
            }
        } catch (error) {
            this.logger.error(`Failed to increment view for ${productId}`, error);
        }
    }

    //ვიყენებთ ქრონს ავტომატური სინქრონიზაციისთვის(რედისთან ერთად ვამუავებთ)
    @Cron(CronExpression.EVERY_10_MINUTES)
    async syncToDb(): Promise<void>{
        const keys = await this.redis.keys('product:views:*')  //ამოვიღებთ ყველა პროდუქტის ნახვების ქის

        if(!keys.length){
            this.logger.log('No new views to sync.');
            return;
        }

        for(const key of keys){
            //ქის სახელიდან (product:views:123) ამოვჭრით უშუალოდ productId-ს (123)
            const productId = key.replace('product:views:', '');

            //GETDEL — იღებს მნიშვნელობას და იმავე წამს შლის Redis-იდან
            const count = await this.redis.getdel(key);
            await this.prisma.product.update({
                where: {id: productId},
                data: {views: {increment: parseInt(count, 10)}}
            })
        }
        
        this.logger.log(`Synced views for ${keys.length} product(s).`);
    }
}