import Joi from '@hapi/joi';

export const configValidationSchema = Joi.object({
  STAGE: Joi.string().required(),
  AUTH_SERVICE_URL: Joi.string().required(),
  TASKS_SERVICE_URL: Joi.string().required(),
});
