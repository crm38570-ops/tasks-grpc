import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatusDto } from './task-status.enum';

export class GetTasksFilterDto {
  @IsOptional()
  @IsEnum(TaskStatusDto)
  @ApiProperty({
    enum: TaskStatusDto,
    required: false,
    description: 'Статус задачи',
  })
  status?: TaskStatusDto;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    type: String,
    description: 'Поиск по задачам',
  })
  searchQuery?: string;
}
