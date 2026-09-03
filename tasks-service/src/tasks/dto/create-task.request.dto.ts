import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import type { CreateTaskRequest } from '../../proto/tasks/generated/tasks_service';

export class CreateTaskRequestDto implements CreateTaskRequest {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsUUID('4')
  userId: string;
}
