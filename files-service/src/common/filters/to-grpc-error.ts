import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export interface GrpcError {
  code: status;
  message: string;
}

const httpToGrpcStatus: Record<number, status> = {
  [HttpStatus.BAD_REQUEST]: status.INVALID_ARGUMENT,
  [HttpStatus.NOT_FOUND]: status.NOT_FOUND,
};

export const toGrpcError = (exception: unknown): GrpcError => {
  if (exception instanceof RpcException) {
    const error = exception.getError();
    if (typeof error === 'object' && error !== null) {
      return error as GrpcError;
    }
    return { code: status.UNKNOWN, message: String(error) };
  }

  if (exception instanceof HttpException) {
    const code = httpToGrpcStatus[exception.getStatus()] ?? status.INTERNAL;
    return {
      code,
      message:
        code === status.INTERNAL
          ? 'Внутренняя ошибка сервера'
          : exception.message,
    };
  }

  return {
    code: status.INTERNAL,
    message: 'Внутренняя ошибка сервера',
  };
};
