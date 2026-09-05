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
      return throwError(() => err);
    }),
  );
