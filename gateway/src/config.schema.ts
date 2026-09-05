import Joi from 'joi';

export const configValidationSchema = Joi.object({
  STAGE: Joi.string().required(),
  PORT: Joi.number().required(),
  AUTH_GRPC_URL: Joi.string().required(),
  TASKS_GRPC_URL: Joi.string().required(),
  FILES_GRPC_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  CORS_ORIGINS: Joi.string().required(),

  MAX_UPLOAD_SIZE: Joi.number().required(),

  GRPC_TIMEOUT_MS: Joi.number().integer().positive().required(),
});
