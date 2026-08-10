import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {

  private readonly logger = new Logger(CloudinaryService.name);

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'catalog',
  ): Promise<UploadApiResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `hyperpay_catalog/${folder}`, // cloudinary-ზე ლამაზად დასალაგებლად
          resource_type: 'image',
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }


  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string 
  ): Promise<UploadApiResponse[]>{
    if(!files || files.length === 0) return [];

    const uplaodPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uplaodPromises)

  }

  async deleteImage(publicId: string): Promise<any> {
    if (!publicId) return;

    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete image from Cloudinary: ${message}`);
    }
  }


  async deleteFiles(publicIds: string[]): Promise<any>{
    if(!publicIds || publicIds.length === 0) return;

    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      this.logger.log(`Successfully deleted Cloudinary resources: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete images from Cloudinary: ${publicIds.join(', ')}`, error);
      throw error;
    }
  }
}