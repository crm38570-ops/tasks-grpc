import { describe, it, expect } from '@jest/globals';
import { toEntityStatus, toGrpcStatus } from '../task-status.mapper';
import { TaskStatus } from '../../enums/task-status.enum';
import { TaskStatus as GrpcTaskStatus } from '../../../proto/tasks/generated/tasks_service';

describe('task-status.mapper', () => {
  it.each([
    [TaskStatus.OPEN, GrpcTaskStatus.TASK_STATUS_OPEN],
    [TaskStatus.IN_PROGRESS, GrpcTaskStatus.TASK_STATUS_IN_PROGRESS],
    [TaskStatus.DONE, GrpcTaskStatus.TASK_STATUS_DONE],
  ])('маппит %s в gRPC-статус и обратно', (entityStatus, grpcStatus) => {
    expect(toGrpcStatus(entityStatus)).toBe(grpcStatus);
    expect(toEntityStatus(grpcStatus)).toBe(entityStatus);
  });

  it('Бросает ошибку на неизвестном gRPC-статусе', () => {
    expect(() => toEntityStatus(999 as GrpcTaskStatus)).toThrow(
      'Unknown task status: 999',
    );
  });
});
