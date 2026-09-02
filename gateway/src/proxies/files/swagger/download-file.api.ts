import {
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function DownloadFileApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Скачивание файла' }),
    ApiProduces('application/octet-stream'),
    ApiParam({
      name: 'fileId',
      type: String,
      format: 'uuid',
      description: 'UUID файла',
    }),
    ApiResponse({
      status: 200,
      description: 'Бинарное содержимое файла',
      content: {
        'application/octet-stream': {
          schema: { type: 'string', format: 'binary' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Некорректный fileId' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Файл не найден' }),
    ApiQuery({ name: 'taskId', required: true, format: 'uuid' }),
  );
}
