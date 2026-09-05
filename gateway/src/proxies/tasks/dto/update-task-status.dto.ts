import { IsEnum } from 'class-validator';
import { TaskStatusDto } from './task-status.enum';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatusDto)
  status: TaskStatusDto;
}
