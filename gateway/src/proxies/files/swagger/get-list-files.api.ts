import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function GetListFilesApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Получение списка файлов задачи' }),
    ApiResponse({ status: 200, description: 'Список файлов задачи' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiQuery({ name: 'taskId', required: true, format: 'uuid' }),
  );
}
