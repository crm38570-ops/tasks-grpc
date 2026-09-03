import type { Task } from '../task.entity';
import type { TaskResponse } from '../../proto/tasks/generated/tasks_service';
import { toGrpcStatus } from './task-status.mapper';

export const toTaskResponse = ({
  id,
  title,
  description,
  status,
}: Task): TaskResponse => ({
  id,
  title,
  description,
  status: toGrpcStatus(status),
});
