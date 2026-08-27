import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

const MAX_FILE_NAME_LENGTH = 255;

export const validateFileName = (fileName: string, logger?: Logger) => {
  const isInvalid =
    !fileName ||
    fileName.length > MAX_FILE_NAME_LENGTH ||
    fileName === '.' ||
    fileName === '..' ||
    /[\\/\u0000-\u001f\u007f]/.test(fileName);

  if (isInvalid) {
    const message = 'Некорректный fileName';

    if (logger) logger.warn(`${message}: ${fileName}`);

    throw new RpcException({ code: status.INVALID_ARGUMENT, message });
  }
};
