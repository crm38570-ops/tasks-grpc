import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

export function DeleteTaskApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Удаление задачи по ID' }),
    ApiParam({
      name: 'id',
      type: String,
      format: 'uuid',
      description: 'UUID задачи',
    }),
  );
}
