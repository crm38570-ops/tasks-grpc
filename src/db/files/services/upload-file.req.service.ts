import { RpcException } from '@nestjs/microservices';
import { UploadFileRequest } from '../../../proto/files/generated/files_service';
import { FILE_MAX_SIZE } from './config';

interface IisErrors {
  errors: RpcException | null;
}

export function UploadFileReqValidator(
  data: UploadFileRequest,
): IisErrors | undefined {
  const { metadata, content } = data;
  const isErrors: IisErrors = { errors: null };

  if (!metadata) {
    isErrors.errors = new RpcException({
      code: 3,
      message: 'metadata обязателен',
    });
    return isErrors;
  }

  if (!content.length) {
    isErrors.errors = new RpcException({
      code: 3,
      message: 'content не может быть пуст',
    });
    return isErrors;
  }

  if (content.length > FILE_MAX_SIZE) {
    isErrors.errors = new RpcException({
      code: 8,
      message: 'content больше допустимого',
    });

    return isErrors;
  }
}
