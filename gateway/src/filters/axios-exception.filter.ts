import {
  BadGatewayException,
  Catch,
  ExceptionFilter,
  GatewayTimeoutException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AxiosError } from 'axios';

@Catch(AxiosError)
export class AxiosExceptionFilter implements ExceptionFilter {
  catch(exception: AxiosError) {
    if (exception.response) {
      const { status, data } = exception.response;

      throw new HttpException(
        typeof data === 'string' ? data : (data as Record<string, any>),
        status,
      );
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
