import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuthCredentialsDto } from '../dto';

const credentials: AuthCredentialsDto = {
  username: 'TestUser',
  password: 'password1',
};

const authService = {
  signUp: jest.fn(),
  signIn: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService as unknown as AuthService);
  });

  it('signUp делегирует запрос в AuthService', async () => {
    const response = { id: 'user-id', username: credentials.username };
    authService.signUp.mockResolvedValue(response);

    await expect(controller.signUp(credentials)).resolves.toEqual(response);
    expect(authService.signUp).toHaveBeenCalledWith(credentials);
  });

  it('signIn делегирует запрос в AuthService', async () => {
    const response = { accessToken: 'signed-token' };
    authService.signIn.mockResolvedValue(response);

    await expect(controller.signIn(credentials)).resolves.toEqual(response);
    expect(authService.signIn).toHaveBeenCalledWith(credentials);
  });
});
