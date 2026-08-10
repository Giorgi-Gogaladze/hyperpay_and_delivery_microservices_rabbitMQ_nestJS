export interface IAddImagesResponse {
  message: string;
  data: {
    variantId: string;
    imageUrl: string;
    imagePublicId: string;
  }[];
}