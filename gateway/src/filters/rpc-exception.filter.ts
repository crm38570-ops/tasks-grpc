import {
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('RpcExceptionFilter', {
    timestamp: true,
  });

  catch(exception: RpcException) {
    const error = exception.getError();
    const { code, message } = (error ?? {}) as {
      code?: number;
      message?: string;
    };
    this.logger.error(
      `gRPC call failed: code=${code ?? 'unknown'}, message=${message ?? 'unknown'}`,
      exception.stack,
    );

    switch (code) {
      case status.INVALID_ARGUMENT:
        throw new BadRequestException(message);
      case status.DEADLINE_EXCEEDED:
        throw new GatewayTimeoutException(message);
      case status.NOT_FOUND:
        throw new NotFoundException(message);
      case status.ALREADY_EXISTS:
        throw new ConflictException(message);
      case status.PERMISSION_DENIED:
        throw new ForbiddenException(message);
      case status.RESOURCE_EXHAUSTED:
        throw new HttpException('Too Many Requests', 429);
      case status.UNAVAILABLE:
        throw new ServiceUnavailableException(message);
      case status.UNAUTHENTICATED:
        throw new UnauthorizedException(message);
      case status.INTERNAL:
      case status.UNKNOWN:
      default:
        throw new InternalServerErrorException(message);
    }
  }
}
