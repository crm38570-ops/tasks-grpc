import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function DeleteTaskApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Удаление задачи по ID' }),
    ApiParam({
      name: 'id',
      type: String,
      format: 'uuid',
      description: 'UUID задачи',
    }),
    ApiResponse({ status: 200, description: 'Задача удалена' }),
    ApiResponse({ status: 400, description: 'Некорректный UUID задачи' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Задача не найдена' }),
  );
}
