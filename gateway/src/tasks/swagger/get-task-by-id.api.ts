import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

export function GetTaskByIdApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Получение задачи по ID' }),
    ApiParam({
      name: 'id',
      type: String,
      format: 'uuid',
      description: 'UUID задачи',
    }),
  );
}
