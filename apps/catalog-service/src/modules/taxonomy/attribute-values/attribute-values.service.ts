import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class AttributeValuesService {
    constructor(private readonly pirsma: PrismaService){}

    
}
