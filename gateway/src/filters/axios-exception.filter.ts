import {
  BadGatewayException,
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
  UnprocessableEntityException,
} from '@nestjs/common';
import { AxiosError } from 'axios';

@Catch(AxiosError)
export class AxiosExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('AxiosExceptionFilter', {
    timestamp: true,
  });

  catch(exception: AxiosError) {
    const context = exception.config?.url ?? 'unknown';
    const details = exception.response
      ? `status=${exception.response.status}`
      : `code=${exception.code ?? 'unknown'}`;
    this.logger.error(
      `Upstream request failed: ${context}, ${details}`,
      exception.stack,
    );

    if (exception.response) {
      const { status } = exception.response;

      switch (status) {
        case 400:
          throw new BadRequestException();
        case 401:
          throw new UnauthorizedException();
        case 403:
          throw new ForbiddenException();
        case 404:
          throw new NotFoundException();
        case 409:
          throw new ConflictException();
        case 422:
          throw new UnprocessableEntityException();
        case 429:
          throw new HttpException('Too Many Requests', 429);
        case 500:
          throw new InternalServerErrorException();
        case 503:
          throw new ServiceUnavailableException();
        default:
          throw new HttpException('Upstream service error', status);
      }
    } else if (exception.code) {
      const { code } = exception;

      if (
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND' ||
        code === 'ECONNABORTED'
      ) {
        throw new BadGatewayException();
      }

      if (code === 'ETIMEDOUT') throw new GatewayTimeoutException();
    } else {
      throw new InternalServerErrorException();
    }
  }
}
