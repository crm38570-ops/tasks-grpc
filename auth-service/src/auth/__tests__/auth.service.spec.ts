import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { AuthCredentialsDto } from '../dto';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../../user/users.repository';

const credentials: AuthCredentialsDto = {
  username: 'TestUser',
  password: 'password1',
};

const user = {
  id: 'user-id',
  username: credentials.username,
  password: 'hashed-password',
};

const usersRepository = {
  createUser: jest.fn(),
  findOne: jest.fn(),
};

const jwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersRepository as unknown as UsersRepository,
      jwtService as unknown as JwtService,
    );
  });

  it('signUp возвращает публичные данные созданного пользователя', async () => {
    usersRepository.createUser.mockResolvedValue(user);

    await expect(service.signUp(credentials)).resolves.toEqual({
      id: user.id,
      username: user.username,
    });
    expect(usersRepository.createUser).toHaveBeenCalledWith(credentials);
  });

  it('signIn возвращает подписанный access token', async () => {
    usersRepository.findOne.mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    jwtService.sign.mockReturnValue('signed-token');

    await expect(service.signIn(credentials)).resolves.toEqual({
      accessToken: 'signed-token',
    });
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { username: credentials.username },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      credentials.password,
      user.password,
    );
    expect(jwtService.sign).toHaveBeenCalledWith({
      username: credentials.username,
      userId: user.id,
    });
  });

  it('signIn выбрасывает UnauthorizedException, если пользователь не найден', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.signIn(credentials)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('signIn выбрасывает UnauthorizedException при неверном пароле', async () => {
    usersRepository.findOne.mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(service.signIn(credentials)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
