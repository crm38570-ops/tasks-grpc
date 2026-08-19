import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../task-status.enum';
import { IsEnum, IsOptional } from 'class-validator';

export class GetTasksFilterDto {
  @ApiProperty({
    enum: TaskStatus,
    enumName: 'TaskStatus',
    example: TaskStatus.OPEN,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({
    example: 'капибары',
    description: 'Ищет совпадения по title или desription задачи',
  })
  @IsOptional()
  searchQuery?: string;
}
