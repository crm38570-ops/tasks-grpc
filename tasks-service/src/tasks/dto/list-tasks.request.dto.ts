import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { ListTasksRequest } from '../../proto/tasks/generated/tasks_service';
import { allowedGrpcStatuses } from './allowed-grpc-statuses';

export class ListTasksRequestDto implements ListTasksRequest {
  @IsOptional()
  @IsIn(allowedGrpcStatuses)
  status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  searchQuery: string;

  @IsString()
  @IsUUID('4')
  userId: string;
}
