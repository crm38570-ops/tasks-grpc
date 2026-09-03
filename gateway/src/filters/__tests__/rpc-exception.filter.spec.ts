import { describe, expect, it } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { RpcExceptionFilter } from '../rpc-exception.filter';

const cases: [number, new (...args: unknown[]) => Error][] = [
  [status.INVALID_ARGUMENT, BadRequestException],
  [status.DEADLINE_EXCEEDED, GatewayTimeoutException],
  [status.NOT_FOUND, NotFoundException],
  [status.ALREADY_EXISTS, ConflictException],
  [status.PERMISSION_DENIED, ForbiddenException],
  [status.RESOURCE_EXHAUSTED, HttpException],
  [status.UNAVAILABLE, ServiceUnavailableException],
  [status.UNAUTHENTICATED, UnauthorizedException],
  [status.INTERNAL, InternalServerErrorException],
  [status.UNKNOWN, InternalServerErrorException],
];

describe('RpcExceptionFilter', () => {
  const filter = new RpcExceptionFilter();

  it.each(cases)(
    'маппит gRPC-код %i в HTTP-исключение %p',
    (code, httpError) => {
      expect(() =>
        filter.catch(new RpcException({ code, message: 'boom' })),
      ).toThrow(httpError);
    },
  );

  it('пробрасывает сообщение gRPC-ошибки в HTTP-исключение', () => {
    let caught: Error | undefined;
    try {
      filter.catch(
        new RpcException({ code: status.NOT_FOUND, message: 'Файл не найден' }),
      );
    } catch (error) {
      caught = error as Error;
    }

    expect(caught).toBeInstanceOf(NotFoundException);
    expect((caught as Error).message).toBe('Файл не найден');
  });

  it('маппит RpcException без кода в 500', () => {
    expect(() => filter.catch(new RpcException('boom'))).toThrow(
      InternalServerErrorException,
    );
  });

  it.each([
    [status.INTERNAL, InternalServerErrorException],
    [status.UNKNOWN, InternalServerErrorException],
    [status.DEADLINE_EXCEEDED, GatewayTimeoutException],
    [status.UNAVAILABLE, ServiceUnavailableException],
  ] as [number, new (...args: unknown[]) => HttpException][])(
    'не пробрасывает внутренний текст ошибки для gRPC-кода %i',
    (code, httpError) => {
      const leaked =
        'gRPC call did not complete within 5000ms; failed to connect to all addresses';
      let caught: Error | undefined;
      try {
        filter.catch(new RpcException({ code, message: leaked }));
      } catch (error) {
        caught = error as Error;
      }

      expect(caught).toBeInstanceOf(httpError);
      expect((caught as Error).message).not.toBe(leaked);
    },
  );
});
