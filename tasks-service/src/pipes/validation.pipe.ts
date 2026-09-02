import { ArgumentMetadata, Injectable, ValidationPipe } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RpcValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
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
