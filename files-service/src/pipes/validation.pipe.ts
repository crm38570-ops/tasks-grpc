import { ArgumentMetadata, Injectable, ValidationPipe } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Readable } from 'node:stream';

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
    if (
      value instanceof Observable ||
      value instanceof Readable ||
      !metadata.metatype ||
      metadata.metatype === Function
    ) {
      return value;
    }

    return super.transform(value, metadata);
  }
}
