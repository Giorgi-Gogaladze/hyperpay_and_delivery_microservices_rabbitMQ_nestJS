import { Test, TestingModule } from '@nestjs/testing';
import { ProductVariantController } from './product-variant.controller';
import { ProductVariantService } from './product-variant.service';

describe('ProductVariantController', () => {
  let controller: ProductVariantController;
  let service: { createProductVariant: jest.Mock; getProductVariantById: jest.Mock; updateProductVariant: jest.Mock; deleteProductVariant: jest.Mock; restockProductVariant: jest.Mock; decreaseStock: jest.Mock };

  beforeEach(async () => {
    service = {
      createProductVariant: jest.fn(),
      getProductVariantById: jest.fn(),
      updateProductVariant: jest.fn(),
      deleteProductVariant: jest.fn(),
      restockProductVariant: jest.fn(),
      decreaseStock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductVariantController],
      providers: [{ provide: ProductVariantService, useValue: service }],
    }).compile();

    controller = module.get<ProductVariantController>(ProductVariantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate createProductVariant to the service', async () => {
    const dto = { price: 10, stock: 5, attributeValueIds: ['value-1'] };
    const result = { id: 'variant-1' };
    service.createProductVariant.mockResolvedValue(result);

    await expect(controller.createProductVariant('product-1', dto as any)).resolves.toBe(result);
    expect(service.createProductVariant).toHaveBeenCalledWith('product-1', dto);
  });
});
