import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { throwError } from 'rxjs';
import { BaseRpcExceptionFilter } from '@nestjs/microservices/exceptions/base-rpc-exception-filter';

const httpToGrpcStatus: Record<number, status> = {
  [HttpStatus.BAD_REQUEST]: status.INVALID_ARGUMENT,
  [HttpStatus.NOT_FOUND]: status.NOT_FOUND,
};

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

    if (exception instanceof HttpException) {
      const grpcCode =
        httpToGrpcStatus[exception.getStatus()] ?? status.INTERNAL;
      const message =
        grpcCode === status.INTERNAL
          ? 'Внутренняя ошибка сервера'
          : exception.message;

      if (exception.getStatus() < Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
        this.logger.warn(
          `Необработанное исключение в gRPC: ${grpcCode}, message=${message}`,
        );
      } else {
        this.logger.error(
          `Необработанное исключение в gRPC: ${message}`,
          exception.stack,
        );
      }

      return throwError(() => ({ code: grpcCode, message }));
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
