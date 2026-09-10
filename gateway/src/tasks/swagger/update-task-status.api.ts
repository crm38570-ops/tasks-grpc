import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
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
  );
}
