import { TaskStatus as GrpcTaskStatus } from '../../proto/tasks/generated/tasks_service';

export const allowedGrpcStatuses: GrpcTaskStatus[] = [
  GrpcTaskStatus.TASK_STATUS_OPEN,
  GrpcTaskStatus.TASK_STATUS_IN_PROGRESS,
  GrpcTaskStatus.TASK_STATUS_DONE,
];
