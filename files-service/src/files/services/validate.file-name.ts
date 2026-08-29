import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

const MAX_FILE_NAME_LENGTH = 255;

export const validateFileName = (fileName: string, logger?: Logger) => {
  const hasControlCharacters = [...fileName].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });

  const isInvalid =
    !fileName ||
    fileName.length > MAX_FILE_NAME_LENGTH ||
    fileName === '.' ||
    fileName === '..' ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    hasControlCharacters;

  if (isInvalid) {
    const message = 'Некорректный fileName';

    if (logger) logger.warn(`${message}: ${fileName}`);

    throw new RpcException({ code: status.INVALID_ARGUMENT, message });
  }
};
