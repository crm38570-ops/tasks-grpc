import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  private logger = new Logger('GrpcExceptionFilter', { timestamp: true });

  catch(exception: unknown, _host: ArgumentsHost) {
    if (exception instanceof RpcException) {
      this.logger.error(exception.stack);
      throw exception;
    }

    void _host;

    // Здесь нужно доделать логирование
    throw new RpcException({
      code: status.INTERNAL,
      message: 'Внутренняя ошибка сервера',
    });
  }
}
