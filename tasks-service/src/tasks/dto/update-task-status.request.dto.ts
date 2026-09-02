import { IsIn, IsString, IsUUID } from 'class-validator';
import type { UpdateTaskStatusRequest } from '../../proto/tasks/generated/tasks_service';
import { allowedGrpcStatuses } from './allowed-grpc-statuses';

export class UpdateTaskStatusRequestDto implements UpdateTaskStatusRequest {
  @IsString()
  @IsUUID('4')
  id: string;

  @IsIn(allowedGrpcStatuses)
  status: number;

  @IsString()
  @IsUUID('4')
  userId: string;
}
