import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SignInApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Авторизация пользователя' }),
    ApiResponse({ status: 200, description: 'Пользователь авторизован' }),
    ApiResponse({
      status: 400,
      description: 'Некорректные данные авторизации',
    }),
  );
}
