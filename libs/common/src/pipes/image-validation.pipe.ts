import { HttpStatus, ParseFilePipeBuilder } from "@nestjs/common";

export interface IImageValidationOptions {
    maxSizeInMb?: number;
    allowedTypes?: RegExp;
    isRequired?: boolean; 
}

export const createImageValidationPipe = (options?: IImageValidationOptions) => {
    const maxSizeInBytes = (options?.maxSizeInMb ?? 5) * 1024 * 1024;
    const allowedTypes = options?.allowedTypes ?? /(jpg|jpeg|png|webp)$/i;
    const isRequired = options?.isRequired ?? false;

    return new ParseFilePipeBuilder()
        .addFileTypeValidator({
            fileType: allowedTypes
        })
        .addMaxSizeValidator({
            maxSize: maxSizeInBytes,
        })
        .build({
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            fileIsRequired: isRequired
        })
}