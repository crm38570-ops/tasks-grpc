import { ArgumentMetadata, Injectable, ValidationPipe } from '@nestjs/common';
import { errorsMapper } from '../files/services/errors.mapper';
import { Observable } from 'rxjs';

@Injectable()
export class RpcValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      exceptionFactory: errorsMapper,
    });
  }

  override async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<any> {
    if (value instanceof Observable) return value;

    return super.transform(value, metadata);
  }
}
