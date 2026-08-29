import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export const validateUploadFileContent = (
  size: number,
  expectedSize?: number,
) => {
  if (!size)
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'content не может быть пустым',
    });

  if (expectedSize !== undefined && size !== expectedSize)
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: `Размер content (${size}) не совпадает с metadata.size (${expectedSize})`,
    });
};
