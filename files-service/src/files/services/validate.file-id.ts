import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export const validateFileId = (fileId: string, logger?: Logger) => {
  if (fileId.includes('..')) {
    const message = 'Некорректный fileId';

    if (logger) logger.warn(`${message}: ${fileId}`);

    throw new RpcException({ code: status.INVALID_ARGUMENT, message });
  }
};
