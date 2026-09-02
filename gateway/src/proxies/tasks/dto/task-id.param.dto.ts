import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TaskIdParamDto {
  @IsUUID('4')
  @ApiProperty({ format: 'uuid', description: 'UUID задачи' })
  id: string;
}
