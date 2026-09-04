import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';
import { BaseRpcExceptionFilter } from '@nestjs/microservices/exceptions/base-rpc-exception-filter';
import { toGrpcError } from './to-grpc-error';

@Catch()
export class GrpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger('GrpcExceptionFilter', {
    timestamp: true,
  });

  catch(exception: unknown, _host: ArgumentsHost) {
    void _host;

    if (exception instanceof RpcException) {
      this.logger.warn(exception.stack);
      return throwError(() => toGrpcError(exception));
    }

    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(
      `Необработанное исключение в gRPC: ${error.message}`,
      error.stack,
    );
    return throwError(() => toGrpcError(exception));
  }
}
