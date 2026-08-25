import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export const validateUploadFileContent = (size: number) => {
  if (!size)
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'content не может быть пустым',
    });
};
