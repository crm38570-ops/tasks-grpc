import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../task-status.enum';

export class TaskResponseDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'uuid v4',
  })
  id: string;

  @ApiProperty({
    example: 'Написать дессертацию',
    description: 'Заголовок задачи',
  })
  title: string;

  @ApiProperty({
    example:
      'Основная тема - "Капибары, почему все мы их так любим?". Использовать ChatGPT 5.6 Sol для максимального погружения в тему',
    description: 'Заголовок задачи',
  })
  description: string;

  @ApiProperty({
    enum: TaskStatus,
    enumName: 'TaskStatus',
    example: TaskStatus.OPEN,
  })
  status: TaskStatus;
}
