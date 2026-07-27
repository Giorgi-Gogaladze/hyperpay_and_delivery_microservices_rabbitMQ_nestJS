import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, OnModuleInit{
    constructor(configService: ConfigService){
        const adapter = new PrismaPg({
            connectionString: configService.getOrThrow<string>('CATALOG_DATABASE_URL')
        });

        super({adapter})
    }

    async onModuleInit() {
        await this.$connect()
    }

    async onModuleDestroy() {
        await this.$disconnect()
    }
}