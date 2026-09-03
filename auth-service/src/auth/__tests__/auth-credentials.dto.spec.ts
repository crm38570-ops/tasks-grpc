import { describe, expect, it } from '@jest/globals';
import { validate } from 'class-validator';
import { AuthCredentialsDto } from '../dto/auth-credentials.dto';

const validateCredentials = async (username: unknown, password: unknown) => {
  const dto = Object.assign(new AuthCredentialsDto(), { username, password });
  return validate(dto);
};

describe('AuthCredentialsDto', () => {
  it('принимает корректные учётные данные', async () => {
    await expect(validateCredentials('TestUser', 'password1')).resolves.toEqual(
      [],
    );
  });

  it.each([
    ['a', 'password1', 'username minimum length'],
    ['A'.repeat(41), 'password1', 'username maximum length'],
    ['123', 'password1', 'username lowercase letter'],
    ['Test.User', 'password1', 'username dot'],
    ['Test\nUser', 'password1', 'username newline'],
    ['TestUser', 'password', 'password digit or special character'],
    ['TestUser', 'p'.repeat(41), 'password maximum length'],
    ['TestUser', 'short1', 'password minimum length'],
  ])('%s / %s отклоняется: %s', async (username, password) => {
    await expect(validateCredentials(username, password)).resolves.not.toEqual(
      [],
    );
  });

  it('отклоняет значения нестрокового типа', async () => {
    await expect(validateCredentials(123, 12345678)).resolves.not.toEqual([]);
  });
});
