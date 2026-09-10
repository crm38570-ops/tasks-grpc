import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateTaskDto } from '../dto';

export function CreateTaskApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Создание задачи' }),
    ApiBody({ type: CreateTaskDto }),
  );
}
