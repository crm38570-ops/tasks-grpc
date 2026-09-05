import { ApiProperty } from '@nestjs/swagger';
import { TaskStatusDto } from './task-status.enum';

export class TaskResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'UUID задачи',
  })
  id: string;

  @ApiProperty({
    description: 'Заголовок задачи',
    example: 'Добавить примеры запросов в Swagger',
  })
  title: string;

  @ApiProperty({
    description: 'Описание задачи',
    example: 'Описать endpoints через декораторы',
  })
  description: string;

  @ApiProperty({
    enum: TaskStatusDto,
    description: 'Статус задачи',
    example: TaskStatusDto.OPEN,
  })
  status: TaskStatusDto;
}

export class TasksListResponseDto {
  @ApiProperty({
    type: [TaskResponseDto],
    description: 'Список задач',
  })
  tasks: TaskResponseDto[];
}
