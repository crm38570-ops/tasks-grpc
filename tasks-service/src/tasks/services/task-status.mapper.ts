import { TaskStatus } from '../enums/task-status.enum';
import { TaskStatus as GrpcTaskStatus } from '../../proto/tasks/generated/tasks_service';

export const toGrpcStatus = (status: TaskStatus): GrpcTaskStatus =>
  GrpcTaskStatus[`TASK_STATUS_${status}` as keyof typeof GrpcTaskStatus];

export const toEntityStatus = (status: GrpcTaskStatus): TaskStatus =>
  GrpcTaskStatus[status].replace('TASK_STATUS_', '') as TaskStatus;
