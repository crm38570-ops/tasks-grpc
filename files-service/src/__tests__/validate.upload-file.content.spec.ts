import { describe, it, expect } from '@jest/globals';
import { RpcException } from '@nestjs/microservices';
import { validateUploadFileContent } from '../files/services/validate.upload-file.content';

describe(`validateUploadFileContent`, () => {
  const maxSize = 10;

  it(`Возвращает RpcException с кодом 3, если size равен 0`, () => {
    let caughtError: unknown;

    try {
      validateUploadFileContent(0, maxSize);
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 3,
      message: 'content пустой или превышает максимальный размер',
    });
  });

  it(`Возвращает RpcException с кодом 3, если size больше maxSize`, () => {
    let caughtError: unknown;

    try {
      validateUploadFileContent(maxSize + 1, maxSize);
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 3,
      message: 'content пустой или превышает максимальный размер',
    });
  });

  it(`Не выбрасывает ошибку, если size в пределах maxSize`, () => {
    expect(() => validateUploadFileContent(1, maxSize)).not.toThrow();
    expect(() => validateUploadFileContent(maxSize, maxSize)).not.toThrow();
  });
});
