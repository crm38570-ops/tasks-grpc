import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateTaskDto, TaskResponseDto } from '../dto';

export function CreateTaskApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Создание задачи' }),
    ApiBody({ type: CreateTaskDto }),
    ApiResponse({
      status: 201,
      description: 'Задача создана',
      type: TaskResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Некорректные данные задачи' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}
