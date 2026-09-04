import { describe, it, expect } from '@jest/globals';
import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { toGrpcError } from '../common/filters/to-grpc-error';

describe(`toGrpcError`, () => {
  it(`Пробрасывает RpcException как есть`, () => {
    const rpcError = { code: status.PERMISSION_DENIED, message: 'denied' };

    expect(toGrpcError(new RpcException(rpcError))).toBe(rpcError);
  });

  it(`Заворачивает RpcException со строкой в UNKNOWN`, () => {
    expect(toGrpcError(new RpcException('boom'))).toEqual({
      code: status.UNKNOWN,
      message: 'boom',
    });
  });

  it(`Маппит NotFoundException в NOT_FOUND(5) с исходным сообщением`, () => {
    expect(toGrpcError(new NotFoundException('Файл не найден'))).toEqual({
      code: status.NOT_FOUND,
      message: 'Файл не найден',
    });
  });

  it(`Маппит BadRequestException в INVALID_ARGUMENT(3)`, () => {
    expect(
      toGrpcError(new BadRequestException('Невалидные метаданные')),
    ).toEqual({
      code: status.INVALID_ARGUMENT,
      message: 'Невалидные метаданные',
    });
  });

  it(`Маппит HTTP 500 в INTERNAL(13) без утечки сообщения`, () => {
    expect(toGrpcError(new HttpException('secret', 500))).toEqual({
      code: status.INTERNAL,
      message: 'Внутренняя ошибка сервера',
    });
  });

  it(`Маппит необработанную ошибку в INTERNAL(13)`, () => {
    expect(toGrpcError(new Error('Database error'))).toEqual({
      code: status.INTERNAL,
      message: 'Внутренняя ошибка сервера',
    });
  });
});
