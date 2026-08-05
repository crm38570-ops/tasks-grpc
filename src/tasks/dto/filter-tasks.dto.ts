import { TaskStatus } from '../task-status.enum';
import { IsEnum, IsOptional } from 'class-validator';

export class GetTasksFilterDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  searchQuery: string;
}
