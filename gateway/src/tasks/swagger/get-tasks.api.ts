import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
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
  );
}
