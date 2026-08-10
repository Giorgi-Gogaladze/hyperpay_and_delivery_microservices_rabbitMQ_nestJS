import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class ProductImagesService {
    constructor(
        private readonly cloudinaryService: CloudinaryService,
        private readonly prisma: PrismaService
    ){}

    async addImages(
        files: Express.Multer.File[],
        variantId: string
    ){
        const existingVariant = await this.prisma.productVariant.findUnique({
            where: {id: variantId},
        });

        if(!existingVariant){
            throw new NotFoundException('productvariant not found!')
        };

        if(!files || files.length === 0){
            throw new BadRequestException('no image files provided');
        }

        const uplaodResult = await this.cloudinaryService.uploadMultipleImages(files, 'products/variants');

        const imageData = uplaodResult.map((res) => ({
            variantId: variantId,
            imageUrl: res.secure_url,
            imagePublicId: res.public_id
        }));

        await this.prisma.productImage.createMany({
            data: imageData,
        });

        return {
            message: `${files.length} images added successfully`,
            data: imageData,
        };
    }
}
