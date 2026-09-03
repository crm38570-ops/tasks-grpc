import { IsString, IsUUID } from 'class-validator';
import type { GetTaskByIdRequest } from '../../proto/tasks/generated/tasks_service';

export class GetTaskByIdRequestDto implements GetTaskByIdRequest {
  @IsString()
  @IsUUID('4')
  id: string;

  @IsString()
  @IsUUID('4')
  userId: string;
}
