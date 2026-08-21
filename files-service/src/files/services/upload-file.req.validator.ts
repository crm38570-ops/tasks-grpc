import { RpcException } from '@nestjs/microservices';
import { UploadFileRequest } from '../../proto/files/generated/files_service';

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

  for (const [key, value] of Object.entries(metadata)) {
    if (!value)
      throw new RpcException({
        code: 3,
        message: `${key} не может быть ${value}`,
      });
  }

  if (!content.length) {
    isErrors.errors = new RpcException({
      code: 3,
      message: 'content не может быть пуст',
    });
    return isErrors;
  }
}
