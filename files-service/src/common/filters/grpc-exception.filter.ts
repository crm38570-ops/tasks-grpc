import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GrpcExceptionFilter', {
    timestamp: true,
  });

  catch(exception: unknown, _host: ArgumentsHost) {
    if (exception instanceof RpcException) {
      this.logger.error(exception.stack);
      throw exception;
    }

    void _host;

    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(
      `Необработанное исключение в gRPC: ${error.message}`,
      error.stack,
    );
    throw new RpcException({
      code: status.INTERNAL,
      message: 'Внутренняя ошибка сервера',
    });
  }
}
