import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SignInApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Авторизация пользователя' }),
    ApiResponse({ status: 401, description: 'Неверные учётные данные' }),
  );
}
