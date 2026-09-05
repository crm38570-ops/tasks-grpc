import { TaskStatus } from '../enums/task-status.enum';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class GetTasksFilterDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  searchQuery?: string;
}
