import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export const validateUploadFileContent = (
  uploadFileContent: Uint8Array<ArrayBufferLike>,
) => {
  if (!uploadFileContent.length)
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'content не может быть пустым',
    });
};
