import { IsString, IsUUID } from 'class-validator';
import type { ValidateTaskOwnerRequest } from '../../proto/tasks_internal/generated/tasks_internal_service';

export class ValidateTaskOwnerRequestDto implements ValidateTaskOwnerRequest {
  @IsString()
  @IsUUID('4')
  taskId: string;

  @IsString()
  @IsUUID('4')
  userId: string;
}
