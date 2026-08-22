import { describe, it, expect } from '@jest/globals';
import { RpcException } from '@nestjs/microservices';
import { validateUploadFileContent } from '../services/validate.upload-file.content';

describe(`validateUploadFileContent`, () => {
  it(`Возвращает RpcException с кодом 3, если content пуст`, () => {
    let caughtError: unknown;

    try {
      validateUploadFileContent(new Uint8Array(0));
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 3,
      message: 'content не может быть пустым',
    });
  });

  it(`Не выбрасывает ошибку, если content не пуст`, () => {
    expect(() =>
      validateUploadFileContent(new Uint8Array([1, 2, 3])),
    ).not.toThrow();
  });

  it(`Не выбрасывает ошибку, если content из нулевых байт`, () => {
    expect(() => validateUploadFileContent(new Uint8Array([0]))).not.toThrow();
  });
});
