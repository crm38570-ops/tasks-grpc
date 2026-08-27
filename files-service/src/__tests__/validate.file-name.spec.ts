import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { validateFileName } from '../files/services/validate.file-name';

describe(`validateFileName`, () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`не выбрасывает ошибку для корректного fileName`, () => {
    expect(() => validateFileName('report.pdf')).not.toThrow();
  });

  it(`возвращает RpcException для пути в fileName`, () => {
    let caughtError: unknown;

    try {
      validateFileName('../etc/passwd');
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: status.INVALID_ARGUMENT,
      message: 'Некорректный fileName',
    });
  });

  it(`возвращает RpcException для управляющего символа в fileName`, () => {
    expect(() => validateFileName('report\n.pdf')).toThrow(RpcException);
  });

  it(`логирует предупреждение при некорректном fileName`, () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    try {
      validateFileName('../etc/passwd', new Logger('Test'));
    } catch {
      // ожидаем ошибку
    }

    expect(warnSpy).toHaveBeenCalledWith(
      'Некорректный fileName: ../etc/passwd',
    );
  });
});
