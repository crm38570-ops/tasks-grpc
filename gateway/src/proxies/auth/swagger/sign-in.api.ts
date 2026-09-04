import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignInResponseDto } from '../dto';

export function SignInApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Авторизация пользователя' }),
    ApiResponse({
      status: 200,
      description: 'Пользователь авторизован',
      type: SignInResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Некорректные данные авторизации',
    }),
    ApiResponse({ status: 401, description: 'Неверные учётные данные' }),
  );
}
