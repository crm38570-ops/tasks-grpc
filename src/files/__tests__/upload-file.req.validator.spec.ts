import { describe, it, expect } from '@jest/globals';
import { UploadFileReqValidator } from '../services/upload-file.req.validator';
import { RpcException } from '@nestjs/microservices';
import { UploadFileRequest } from '../../proto/files/generated/files_service';

describe('UploadFileReqValidator', () => {
  it('Возвращает ошибку, если нет metadata', () => {
    const result = UploadFileReqValidator({
      content: Buffer.from('x'),
    } as any as UploadFileRequest);

    expect(result?.errors).toBeInstanceOf(RpcException);

    expect(result?.errors?.getError()).toEqual({
      code: 3,
      message: 'metadata обязателен',
    });
  });

  it('Возвращает ошибку, если content пуст', () => {
    const result = UploadFileReqValidator({
      content: Buffer.from(''),
      metadata: {
        fileName: 'some_name',
        mimeType: 'png',
        size: 123432,
        taskId: 'some_id',
      },
    });

    expect(result?.errors).toBeInstanceOf(RpcException);

    expect(result?.errors?.getError()).toEqual({
      code: 3,
      message: 'content не может быть пуст',
    });
  });

  it('Возвращает undefined, если всё хорошо', () => {
    const result = UploadFileReqValidator({
      content: Buffer.from('x'),
      metadata: {
        fileName: 'some_name',
        mimeType: 'png',
        size: 123432,
        taskId: 'some_id',
      },
    });
    expect(result).toEqual(undefined);
  });
});
