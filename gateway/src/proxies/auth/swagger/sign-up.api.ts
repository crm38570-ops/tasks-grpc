import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SignUpApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Регистрация пользователя' }),
    ApiResponse({ status: 201, description: 'Пользователь зарегистрирован' }),
    ApiResponse({
      status: 400,
      description: 'Некорректные данные регистрации',
    }),
    ApiResponse({
      status: 409,
      description: 'Пользователь с таким именем уже существует',
    }),
  );
}
