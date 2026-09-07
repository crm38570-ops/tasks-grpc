import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { UploadFileResponseDto } from '../dto';

export function UploadFileApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Загрузка файла в задачу' }),
    ApiConsumes('multipart/form-data'),
    ApiParam({
      name: 'taskId',
      required: true,
      format: 'uuid',
      description: 'UUID задачи',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Загружаемый файл',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Файл загружен',
      type: UploadFileResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Некорректные данные файла' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Задача не найдена или не принадлежит пользователю',
    }),
    ApiResponse({
      status: 413,
      description: 'Файл превышает максимальный размер',
    }),
  );
}
