import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  IDENTITY_PORT: Joi.number().default(3001),
  IDENTITY_DATABASE_URL: Joi.string().uri().required(),

  WALLET_PORT: Joi.number().default(3002),
  WALLET_DATABASE_URL: Joi.string().uri().required(),

  LOGISTICS_PORT: Joi.number().default(3003),
  LOGISTICS_DATABASE_URL: Joi.string().uri().required(),

  CATALOG_PORT: Joi.number().default(3004),
  CATALOG_DATABASE_URL: Joi.string().uri().required(),

  RABBITMQ_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  RESEND_API_KEY: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().required(),

  CLOUDINARY_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  STORE_LATITUDE: Joi.number().required(),
  STORE_LONGITUDE: Joi.number().required(),
  DELIVERY_BASE_FEE: Joi.number().required(),
  DELIVERY_PER_KM_FEE: Joi.number().required()

});