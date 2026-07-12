import * as Joi from 'joi'

export const evnValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    ORDER_PORT: Joi.number().default(3003).required(),
    ORDER_DATABASE_URL: Joi.string().required(),
}).unknown(true)