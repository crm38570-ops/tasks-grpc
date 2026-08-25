import { ValidationPipe } from '@nestjs/common';
import { errorsMapper } from '../services/errors.mapper';

export const RpcValidationPipe: ValidationPipe = new ValidationPipe({
  whitelist: true,
  exceptionFactory: errorsMapper,
});
