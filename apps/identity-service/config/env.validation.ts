import * as Joi from 'joi'

export const evnValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    IDENTITY_PORT: Joi.number().default(3001).required(),
    IDENTITY_DATABASE_URL: Joi.string().required(),
}).unknown(true)