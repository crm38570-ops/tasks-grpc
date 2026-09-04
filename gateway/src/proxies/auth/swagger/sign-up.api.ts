import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignUpResponseDto } from '../dto';

export function SignUpApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Регистрация пользователя' }),
    ApiResponse({
      status: 201,
      description: 'Пользователь зарегистрирован',
      type: SignUpResponseDto,
    }),
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
