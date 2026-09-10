import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SignUpApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Регистрация пользователя' }),
    ApiResponse({
      status: 409,
      description: 'Пользователь с таким именем уже существует',
    }),
  );
}
