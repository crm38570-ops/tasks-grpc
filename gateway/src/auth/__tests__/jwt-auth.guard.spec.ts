import { describe, it, expect, jest } from '@jest/globals';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../jwt-auth.guard';

const makeContext = (headers: Record<string, string>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  }) as unknown as ExecutionContext;

describe(`JwtAuthGuard`, () => {
  const makeGuard = (verify: jest.Mock) =>
    new JwtAuthGuard({ verify } as unknown as JwtService);

  it.each([
    ['нет заголовка Authorization', {}],
    ['тип не Bearer', { authorization: 'Basic abc' }],
    ['Bearer без токена', { authorization: 'Bearer ' }],
  ] as [string, Record<string, string>][])(
    'кидает Unauthorized, если %s',
    (_name, headers) => {
      const verify = jest.fn();
      const guard = makeGuard(verify);

      expect(() => guard.canActivate(makeContext(headers))).toThrow(
        UnauthorizedException,
      );
      expect(verify).not.toHaveBeenCalled();
    },
  );

  it('кидает Unauthorized, если токен не прошёл верификацию', () => {
    const guard = makeGuard(
      jest.fn(() => {
        throw new Error('jwt expired');
      }),
    );

    expect(() =>
      guard.canActivate(makeContext({ authorization: 'Bearer bad-token' })),
    ).toThrow('Invalid or expired token');
  });

  it('кидает Unauthorized, если в payload нет userId', () => {
    const guard = makeGuard(jest.fn(() => ({ username: 'ivan' })));

    expect(() =>
      guard.canActivate(makeContext({ authorization: 'Bearer token' })),
    ).toThrow('Invalid token payload');
  });

  it('при валидном токене возвращает true и вешает payload на request.user', () => {
    const payload = { username: 'ivan', userId: 'user-1' };
    const verify = jest.fn(() => payload);
    const guard = makeGuard(verify);
    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer good-token' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(verify).toHaveBeenCalledWith('good-token', {
      algorithms: ['HS256'],
    });
    expect(request.user).toEqual(payload);
  });
});
