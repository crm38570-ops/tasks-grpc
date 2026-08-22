import { describe, it, expect } from '@jest/globals';
import { RpcException } from '@nestjs/microservices';
import { validateFileUser } from '../services/validate.file-user';
import { FileEntity } from '../file.entity';
import { mockFileUserId } from './variables';

describe(`validateFileUser`, () => {
  const ownedFile = {
    fileId: mockFileUserId.fileId,
    userId: mockFileUserId.userId,
  } as FileEntity;

  it(`Завершается успешно, если файл принадлежит пользователю`, () => {
    expect(() =>
      validateFileUser({ file: ownedFile, userId: mockFileUserId.userId }),
    ).not.toThrow();
  });

  it(`Возвращает RpcException с кодом 5, если файл не найден`, () => {
    let caughtError: unknown;

    try {
      validateFileUser({ file: null, userId: mockFileUserId.userId });
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 5,
      message: 'Файл не найден',
    });
  });

  it(`Возвращает RpcException с кодом 5, если файл принадлежит другому пользователю`, () => {
    let caughtError: unknown;

    try {
      validateFileUser({
        file: {
          fileId: mockFileUserId.fileId,
          userId: 'другой пользователь',
        } as FileEntity,
        userId: mockFileUserId.userId,
      });
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 5,
      message: 'Файл не найден',
    });
  });
});
