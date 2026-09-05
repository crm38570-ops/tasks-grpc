import { describe, expect, it } from '@jest/globals';
import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { GrpcExceptionFilter } from '../grpc-exception.filter';

const cases: [HttpException, status][] = [
  [new NotFoundException('Task not found'), status.NOT_FOUND],
  [new BadRequestException('Validation failed'), status.INVALID_ARGUMENT],
  [new HttpException('Unexpected', 500), status.INTERNAL],
];

describe('GrpcExceptionFilter', () => {
  const filter = new GrpcExceptionFilter();
  const host = {} as ArgumentsHost;

  it.each(cases)(
    'маппит HTTP-исключение %p в gRPC-код %i',
    async (httpError, code) => {
      const caught = await firstValueFrom(filter.catch(httpError, host)).catch(
        (e: unknown) => e,
      );

      expect(caught).toEqual({
        code,
        message:
          code === status.INTERNAL
            ? 'Внутренняя ошибка сервера'
            : httpError.message,
      });
    },
  );

  it('пробрасывает RpcException как есть', async () => {
    const rpcError = { code: status.PERMISSION_DENIED, message: 'denied' };

    const caught = await firstValueFrom(
      filter.catch(new RpcException(rpcError), host),
    ).catch((e: unknown) => e);

    expect(caught).toBe(rpcError);
  });

  it('маппит необработанную ошибку в INTERNAL', async () => {
    const caught = await firstValueFrom(
      filter.catch(new Error('Database error'), host),
    ).catch((e: unknown) => e);

    expect(caught).toEqual({
      code: status.INTERNAL,
      message: 'Внутренняя ошибка сервера',
    });
  });
});
