import { status } from '@grpc/grpc-js';
import { ValidationError } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export const errorsMapper = (errors: ValidationError[]) => {
  const collect = (errs: ValidationError[]): string[] =>
    errs.flatMap((e) => [
      ...Object.values(e.constraints ?? {}),
      ...(e.children?.length ? collect(e.children) : []),
    ]);

  return new RpcException({
    code: status.INVALID_ARGUMENT,
    message: collect(errors).join('; '),
  });
};
