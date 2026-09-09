import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import {
  catchError,
  Observable,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';

export const withDeadline = <T>(
  source: Observable<T>,
  timeoutMs: number,
): Observable<T> =>
  source.pipe(
    timeout(timeoutMs),
    catchError((err: unknown) => {
      if (err instanceof TimeoutError) {
        return throwError(
          () =>
            new RpcException({
              code: status.DEADLINE_EXCEEDED,
              message: `gRPC call did not complete within ${timeoutMs}ms`,
            }),
        );
      }

      const grpcError = err as { code?: unknown; details?: unknown };
      if (
        typeof grpcError?.code === 'number' &&
        typeof grpcError?.details === 'string'
      ) {
        return throwError(
          () =>
            new RpcException({
              code: grpcError.code as status,
              message: grpcError.details,
            }),
        );
      }

      return throwError(() => err);
    }),
  );
