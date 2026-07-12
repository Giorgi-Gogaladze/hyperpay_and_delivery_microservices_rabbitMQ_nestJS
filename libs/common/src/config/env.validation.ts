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
});