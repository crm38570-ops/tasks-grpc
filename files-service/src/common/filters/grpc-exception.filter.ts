import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { throwError } from 'rxjs';
import { BaseRpcExceptionFilter } from '@nestjs/microservices/exceptions/base-rpc-exception-filter';

@Catch()
export class GrpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger('GrpcExceptionFilter', {
    timestamp: true,
  });

  catch(exception: unknown, _host: ArgumentsHost) {
    void _host;

    if (exception instanceof RpcException) {
      this.logger.error(exception.stack);
      return throwError(() => exception.getError());
    }

    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(
      `Необработанное исключение в gRPC: ${error.message}`,
      error.stack,
    );
    return throwError(() => ({
      code: status.INTERNAL,
      message: 'Внутренняя ошибка сервера',
    }));
  }
}
