import { describe, it, expect } from '@jest/globals';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom, of, throwError, timer, toArray } from 'rxjs';
import { withDeadline } from '../with-deadline';

describe(`withDeadline`, () => {
  it('пропускает значения через себя', async () => {
    const result = await lastValueFrom(
      withDeadline(of(1, 2, 3), 1000).pipe(toArray()),
    );

    expect(result).toEqual([1, 2, 3]);
  });

  it('маппит TimeoutError в RpcException с кодом DEADLINE_EXCEEDED', async () => {
    const error = await lastValueFrom(withDeadline(timer(50), 10)).catch(
      (err: unknown) => err,
    );

    expect(error).toBeInstanceOf(RpcException);
    expect((error as RpcException).getError()).toEqual({
      code: status.DEADLINE_EXCEEDED,
      message: 'gRPC call did not complete within 10ms',
    });
  });

  it('пробрасывает остальные ошибки как есть', async () => {
    const original = new RpcException({
      code: status.NOT_FOUND,
      message: 'nope',
    });
    const error = await lastValueFrom(
      withDeadline(
        throwError(() => original),
        1000,
      ),
    ).catch((err: unknown) => err);

    expect(error).toBe(original);
  });
});
