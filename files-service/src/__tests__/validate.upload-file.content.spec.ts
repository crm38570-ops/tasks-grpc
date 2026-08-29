import { describe, it, expect } from '@jest/globals';
import { RpcException } from '@nestjs/microservices';
import { validateUploadFileContent } from '../files/services/validate.upload-file.content';

describe(`validateUploadFileContent`, () => {
  it(`Возвращает RpcException с кодом 3, если size равен 0`, () => {
    let caughtError: unknown;

    try {
      validateUploadFileContent(0);
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 3,
      message: 'content не может быть пустым',
    });
  });

  it(`Не выбрасывает ошибку, если size больше нуля`, () => {
    expect(() => validateUploadFileContent(1)).not.toThrow();
  });

  it(`Не выбрасывает ошибку, если size совпадает с expectedSize`, () => {
    expect(() => validateUploadFileContent(3, 3)).not.toThrow();
  });

  it(`Возвращает RpcException, если size не совпадает с expectedSize`, () => {
    let caughtError: unknown;

    try {
      validateUploadFileContent(3, 5);
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 3,
      message: 'Размер content (3) не совпадает с metadata.size (5)',
    });
  });
});
