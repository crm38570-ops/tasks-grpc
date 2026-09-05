import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export const validateUploadFileContent = (size: number, maxSize: number) => {
  if (!size || size > maxSize)
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'content пустой или превышает максимальный размер',
    });
};
