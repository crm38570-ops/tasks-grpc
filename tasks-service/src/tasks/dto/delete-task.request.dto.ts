import { IsString, IsUUID } from 'class-validator';
import type { DeleteTaskRequest } from '../../proto/tasks/generated/tasks_service';

export class DeleteTaskRequestDto implements DeleteTaskRequest {
  @IsString()
  @IsUUID('4')
  id: string;

  @IsString()
  @IsUUID('4')
  userId: string;
}
