import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function DeleteFileApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Удаление файла' }),
    ApiParam({
      name: 'fileId',
      type: String,
      format: 'uuid',
      description: 'UUID файла',
    }),
    ApiResponse({ status: 200, description: 'Файл удалён' }),
    ApiResponse({ status: 400, description: 'Некорректный fileId или taskId' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Файл не найден или нет доступа' }),
    ApiQuery({ name: 'taskId', required: true, format: 'uuid' }),
  );
}
