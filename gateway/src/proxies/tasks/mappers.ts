import { TaskStatus as GrpcTaskStatus } from '../../proto/tasks/generated/tasks_service';
import type { TaskResponse } from '../../proto/tasks/generated/tasks_service';
import { TaskStatusDto } from './dto/task-status.enum';

export const toGrpcStatus = (status: TaskStatusDto): GrpcTaskStatus =>
  GrpcTaskStatus[`TASK_STATUS_${status}` as keyof typeof GrpcTaskStatus];

export const fromGrpcStatus = (status: GrpcTaskStatus): TaskStatusDto =>
  GrpcTaskStatus[status].replace('TASK_STATUS_', '') as TaskStatusDto;

export const mapTask = (task: TaskResponse | undefined) => {
  if (!task) return task;

  const { id, title, description, status } = task;
  return {
    id,
    title,
    description,
    status: fromGrpcStatus(status),
  };
};
