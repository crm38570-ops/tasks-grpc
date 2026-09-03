import Joi from 'joi';

export const configValidationSchema = Joi.object({
  STAGE: Joi.string().required(),
  GRPC_PORT: Joi.number().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432).required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  FILE_DIR: Joi.string().required(),
  MAX_UPLOAD_SIZE: Joi.number().integer().positive().required(),
  TASKS_GRPC_URL: Joi.string().required(),
  TASKS_GRPC_TIMEOUT_MS: Joi.number().integer().positive().required(),
});
