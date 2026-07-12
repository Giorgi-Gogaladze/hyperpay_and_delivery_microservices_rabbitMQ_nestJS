import * as Joi from 'joi'

export const evnValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    CATALOG_PORT: Joi.number().default(3002).required(),
    CATALOG_DATABASE_URL: Joi.string().required(),
}).unknown(true)