import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { validateFileId } from '../files/services/validate.file-id';

describe(`validateFileId`, () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`Не выбрасывает ошибку для корректного fileId`, () => {
    expect(() => validateFileId('id-1')).not.toThrow();
  });

  it(`Возвращает RpcException с INVALID_ARGUMENT, если fileId содержит '..'`, () => {
    let caughtError: unknown;

    try {
      validateFileId('../etc/passwd');
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: status.INVALID_ARGUMENT,
      message: 'Некорректный fileId',
    });
  });

  it(`Логирует предупреждение при некорректном fileId`, () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    try {
      validateFileId('../etc/passwd', new Logger('Test'));
    } catch {
      // ожидаем ошибку
    }

    expect(warnSpy).toHaveBeenCalledWith('Некорректный fileId: ../etc/passwd');
  });
});
