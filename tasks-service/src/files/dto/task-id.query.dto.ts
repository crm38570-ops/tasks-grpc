import { IsUUID } from 'class-validator';

export class TaskIdQueryDto {
  @IsUUID('4')
  taskId: string;
}
