import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import type { CreateTaskRequest } from '../../proto/tasks/generated/tasks_service';

export class CreateTaskRequestDto implements CreateTaskRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @IsString()
  @IsUUID('4')
  userId: string;
}
