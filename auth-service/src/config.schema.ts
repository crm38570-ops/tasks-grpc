import Joi from 'joi';

export const configValidationSchema = Joi.object({
  STAGE: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432).required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  LEGACY_DB_HOST: Joi.string().optional(),
  LEGACY_DB_PORT: Joi.number().optional(),
  LEGACY_DB_USERNAME: Joi.string().optional(),
  LEGACY_DB_PASSWORD: Joi.string().optional(),
  LEGACY_DB_DATABASE: Joi.string().optional(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  DUMMY_BCRYPT_HASH: Joi.string()
    .pattern(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/)
    .required(),
});
