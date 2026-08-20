import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, _host: ArgumentsHost) {
    if (exception instanceof RpcException) {
      throw exception;
    }

    void _host;

    console.error(exception);

    throw new RpcException({
      code: status.INTERNAL,
      message: 'Внутренняя ошибка сервера',
    });
  }
}
