import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { TaskStatusDto } from '../dto';

export function GetTasksApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Получение всех задач' }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: TaskStatusDto,
      description: 'Статус задачи',
    }),
    ApiQuery({
      name: 'searchQuery',
      required: false,
      type: String,
      description: 'Поиск по задачам',
    }),
    ApiResponse({ status: 200, description: 'Список задач' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}
