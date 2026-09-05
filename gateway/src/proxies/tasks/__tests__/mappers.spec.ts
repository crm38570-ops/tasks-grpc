import { describe, it, expect } from '@jest/globals';
import { TaskStatus } from '../../../proto/tasks/generated/tasks_service';
import { TaskStatusDto } from '../dto/task-status.enum';
import { fromGrpcStatus, mapTask, toGrpcStatus } from '../mappers';

describe(`toGrpcStatus`, () => {
  it.each([
    [TaskStatusDto.OPEN, TaskStatus.TASK_STATUS_OPEN],
    [TaskStatusDto.IN_PROGRESS, TaskStatus.TASK_STATUS_IN_PROGRESS],
    [TaskStatusDto.DONE, TaskStatus.TASK_STATUS_DONE],
  ])('маппит %s в %i', (dto, grpc) => {
    expect(toGrpcStatus(dto)).toBe(grpc);
  });
});

describe(`fromGrpcStatus`, () => {
  it.each([
    [TaskStatus.TASK_STATUS_OPEN, TaskStatusDto.OPEN],
    [TaskStatus.TASK_STATUS_IN_PROGRESS, TaskStatusDto.IN_PROGRESS],
    [TaskStatus.TASK_STATUS_DONE, TaskStatusDto.DONE],
  ])('маппит %i в %s', (grpc, dto) => {
    expect(fromGrpcStatus(grpc)).toBe(dto);
  });
});

describe(`mapTask`, () => {
  it('возвращает undefined как есть', () => {
    expect(mapTask(undefined)).toBeUndefined();
  });

  it('маппит gRPC-статус в DTO-строку', () => {
    expect(
      mapTask({
        id: 't-1',
        title: 'Заголовок',
        description: 'Описание',
        status: TaskStatus.TASK_STATUS_IN_PROGRESS,
      }),
    ).toEqual({
      id: 't-1',
      title: 'Заголовок',
      description: 'Описание',
      status: TaskStatusDto.IN_PROGRESS,
    });
  });
});
