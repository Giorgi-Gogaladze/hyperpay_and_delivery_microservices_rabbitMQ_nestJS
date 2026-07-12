import * as Joi from 'joi'

export const evnValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    WALLET_PORT: Joi.number().default(3004).required(),
    WALLET_DATABASE_URL: Joi.string().required(),
}).unknown(true)