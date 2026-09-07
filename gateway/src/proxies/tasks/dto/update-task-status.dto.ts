import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TaskStatusDto } from './task-status.enum';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatusDto)
  @ApiProperty({
    enum: TaskStatusDto,
    description: 'Новый статус задачи',
    example: TaskStatusDto.IN_PROGRESS,
  })
  status: TaskStatusDto;
}
