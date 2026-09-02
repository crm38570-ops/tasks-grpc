import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UpdateTaskStatusDto } from '../dto';

export function UpdateTaskStatusApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Обновление статуса задачи' }),
    ApiBody({ type: UpdateTaskStatusDto }),
    ApiParam({
      name: 'id',
      type: String,
      format: 'uuid',
      description: 'UUID задачи',
    }),
    ApiResponse({ status: 200, description: 'Статус обновлён' }),
    ApiResponse({
      status: 400,
      description: 'Некорректный UUID задачи или status',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 404, description: 'Задача не найдена' }),
  );
}
