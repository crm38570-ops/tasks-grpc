import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function UploadFileApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Загрузка файла' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file', 'taskId'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Загружаемый файл',
          },
          taskId: {
            type: 'string',
            format: 'uuid',
            description: 'UUID задачи',
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Файл загружен' }),
    ApiResponse({ status: 400, description: 'Некорректные данные файла' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Задача не найдена' }),
  );
}
