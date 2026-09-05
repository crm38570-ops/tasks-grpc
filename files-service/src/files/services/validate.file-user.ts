import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FileEntity } from '../file.entity';

export interface FileOwnership {
  file: FileEntity | null;
  userId: string;
}

export const validateFileUser = (fileOwnership: FileOwnership): FileEntity => {
  const { file, userId } = fileOwnership;

  if (!file)
    throw new RpcException({
      code: status.NOT_FOUND,
      message: 'Файл не найден',
    });

  if (file.userId !== userId)
    throw new RpcException({
      code: status.NOT_FOUND,
      message: 'Файл не найден',
    });

  return file;
};
