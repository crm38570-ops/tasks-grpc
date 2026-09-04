import { describe, it, expect, jest } from '@jest/globals';
import type { ConfigService } from '@nestjs/config';
import type { ClientGrpc } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  TaskStatus,
  type TaskResponse,
} from '../../../proto/tasks/generated/tasks_service';
import type {
  CreateTaskDto,
  GetTasksFilterDto,
  UpdateTaskStatusDto,
} from '../dto';
import { TasksProxyService } from '../tasks-proxy.service';

const taskResponse: TaskResponse = {
  id: 't-1',
  title: 'Заголовок',
  description: 'Описание',
  status: TaskStatus.TASK_STATUS_OPEN,
};

const makeService = () => {
  const stub = {
    createTask: jest.fn().mockReturnValue(of({ task: taskResponse })),
    listTasks: jest.fn().mockReturnValue(of({ tasks: [taskResponse] })),
    getTaskById: jest.fn().mockReturnValue(of({ task: taskResponse })),
    deleteTask: jest.fn().mockReturnValue(of({})),
    updateTaskStatus: jest.fn().mockReturnValue(of({ task: taskResponse })),
  };
  const client = {
    getService: jest.fn().mockReturnValue(stub),
  } as unknown as ClientGrpc;
  const config = {
    getOrThrow: jest.fn().mockReturnValue(5000),
  } as unknown as ConfigService;

  const service = new TasksProxyService(client, config);
  service.onModuleInit();

  return { service, stub };
};

describe(`TasksProxyService`, () => {
  it('createTask проксирует запрос с userId и маппит ответ', async () => {
    const { service, stub } = makeService();
    const dto: CreateTaskDto = { title: 'Заголовок', description: 'Описание' };

    const result = await service.createTask(dto, 'user-1');

    expect(stub.createTask).toHaveBeenCalledWith({
      title: 'Заголовок',
      description: 'Описание',
      userId: 'user-1',
    });
    expect(result).toEqual({
      id: 't-1',
      title: 'Заголовок',
      description: 'Описание',
      status: 'OPEN',
    });
  });

  it('getTasks конвертирует DTO-статус в gRPC и подставляет searchQuery по умолчанию', async () => {
    const { service, stub } = makeService();
    const filter: GetTasksFilterDto = { status: 'IN_PROGRESS' };

    const result = await service.getTasks(filter, 'user-1');

    expect(stub.listTasks).toHaveBeenCalledWith({
      status: TaskStatus.TASK_STATUS_IN_PROGRESS,
      searchQuery: '',
      userId: 'user-1',
    });
    expect(result).toEqual({
      tasks: [
        {
          id: 't-1',
          title: 'Заголовок',
          description: 'Описание',
          status: 'OPEN',
        },
      ],
    });
  });

  it('getTasks без статуса не передаёт его в gRPC', async () => {
    const { service, stub } = makeService();

    await service.getTasks({ searchQuery: 'найти' }, 'user-1');

    expect(stub.listTasks).toHaveBeenCalledWith({
      status: undefined,
      searchQuery: 'найти',
      userId: 'user-1',
    });
  });

  it('getTaskById передаёт id и userId', async () => {
    const { service, stub } = makeService();

    await service.getTaskById('task-1', 'user-1');

    expect(stub.getTaskById).toHaveBeenCalledWith({
      id: 'task-1',
      userId: 'user-1',
    });
  });

  it('deleteTask передаёт id и userId', async () => {
    const { service, stub } = makeService();

    await service.deleteTask('task-1', 'user-1');

    expect(stub.deleteTask).toHaveBeenCalledWith({
      id: 'task-1',
      userId: 'user-1',
    });
  });

  it('updateTaskStatus конвертирует DTO-статус в gRPC', async () => {
    const { service, stub } = makeService();
    const dto: UpdateTaskStatusDto = { status: 'DONE' };

    await service.updateTaskStatus('task-1', dto, 'user-1');

    expect(stub.updateTaskStatus).toHaveBeenCalledWith({
      id: 'task-1',
      status: TaskStatus.TASK_STATUS_DONE,
      userId: 'user-1',
    });
  });
});
