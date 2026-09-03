import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { DataSource, QueryFailedError } from 'typeorm';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users.repository';
import { AuthCredentialsDto } from '../../auth/dto';

const credentials: AuthCredentialsDto = {
  username: 'TestUser',
  password: 'password1',
};

const createdUser = {
  id: 'user-id',
  username: credentials.username,
  password: 'hashed-password',
};

describe('UsersRepository', () => {
  const dataSource = {
    createEntityManager: jest.fn().mockReturnValue({}),
  } as unknown as DataSource;
  let repository: UsersRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UsersRepository(dataSource);
  });

  it('createUser хеширует пароль и сохраняет пользователя', async () => {
    jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
    const createSpy = jest
      .spyOn(repository, 'create')
      .mockReturnValue(createdUser);
    const saveSpy = jest
      .spyOn(repository, 'save')
      .mockResolvedValue(createdUser);

    await expect(repository.createUser(credentials)).resolves.toEqual(
      createdUser,
    );
    expect(bcrypt.genSalt).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith(credentials.password, 'salt');
    expect(createSpy).toHaveBeenCalledWith({
      username: credentials.username,
      password: 'hashed-password',
    });
    expect(saveSpy).toHaveBeenCalledWith(createdUser);
  });

  it('createUser преобразует ошибку уникальности username в RpcException ALREADY_EXISTS', async () => {
    const error = new QueryFailedError('INSERT', [], new Error('duplicate'));
    (
      error as QueryFailedError & { driverError: { code: string } }
    ).driverError = { code: '23505' };
    jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
    jest.spyOn(repository, 'create').mockReturnValue(createdUser);
    jest.spyOn(repository, 'save').mockRejectedValue(error);

    let caughtError: RpcException | undefined;
    try {
      await repository.createUser(credentials);
    } catch (e) {
      caughtError = e as RpcException;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect(caughtError?.getError()).toEqual({
      code: status.ALREADY_EXISTS,
      message: 'Username already exists',
    });
  });

  it('createUser преобразует прочую ошибку TypeORM в RpcException INTERNAL', async () => {
    const error = new QueryFailedError('INSERT', [], new Error('database'));
    (
      error as QueryFailedError & { driverError: { code: string } }
    ).driverError = { code: '42P01' };
    jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
    jest.spyOn(repository, 'create').mockReturnValue(createdUser);
    jest.spyOn(repository, 'save').mockRejectedValue(error);

    let caughtError: RpcException | undefined;
    try {
      await repository.createUser(credentials);
    } catch (e) {
      caughtError = e as RpcException;
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect(caughtError?.getError()).toEqual({
      code: status.INTERNAL,
      message: 'Internal server error',
    });
  });

  it('createUser пробрасывает неизвестную ошибку без изменений', async () => {
    const error = new Error('database unavailable');
    jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
    jest.spyOn(repository, 'create').mockReturnValue(createdUser);
    jest.spyOn(repository, 'save').mockRejectedValue(error);

    await expect(repository.createUser(credentials)).rejects.toBe(error);
  });
});
