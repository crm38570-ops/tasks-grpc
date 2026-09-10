import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatusDto } from './task-status.enum';

export class GetTasksFilterDto {
  @IsOptional()
  @IsEnum(TaskStatusDto)
  status?: TaskStatusDto;

  @IsOptional()
  @IsString()
  searchQuery?: string;
}
