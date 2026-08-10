import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IAddImagesResponse } from '../../../interfaces/add-image-response.interface';
import { ProductImage } from '../../../generated/prisma/client';

@Injectable()
export class ProductImagesService {

    private logger = new Logger(ProductImagesService.name);

    constructor(
        private readonly cloudinaryService: CloudinaryService,
        private readonly prisma: PrismaService
    ){}

    async uploadImages(
        files: Express.Multer.File[],
        variantId: string
    ): Promise<IAddImagesResponse>{
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


    async getVariantImages(variantId: string): Promise<{message: string, data: ProductImage[]}>{
        const variant = await this.prisma.productVariant.findUnique({
            where: {id: variantId}
        });

        if(!variant){
            throw new NotFoundException('productvariant not found!')
        };

        const variantImages = await this.prisma.productImage.findMany({
            where: {variantId},
            orderBy: {createdAt: 'asc'}
        })

        return {
            message: 'variant iamges:',
            data: variantImages
        }
    }


    async removeImages(variantId: string): Promise<{message: string}>{
        const images = await this.prisma.productImage.findMany({
            where: {variantId},
        }); 

        if (!images || images.length === 0) {
            return { message: 'No images to remove' };
        };

        const imagePublicIds = images.map((image) => image.imagePublicId);

        await this.prisma.productImage.deleteMany({
            where: {variantId}
        });

        if(imagePublicIds.length > 0){
            this.cloudinaryService.deleteFiles(imagePublicIds).catch((err) => {
                this.logger.error('failed to delete images for this product variant')
            })
        }

        return {message: 'images removed successfuly for that product variant!'}
        
    }


    async updateVariantImages(
        variantId: string,
        files: Express.Multer.File[],
    ): Promise<void>{
        const existingVariant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
        });

        if(!existingVariant){
            throw new NotFoundException('product not found')
        }

        await this.removeImages(variantId);
        await this.uploadImages(files, variantId)
    }
}
