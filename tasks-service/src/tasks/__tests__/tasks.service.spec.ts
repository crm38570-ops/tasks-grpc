import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TasksService } from '../tasks.service';
import { Test } from '@nestjs/testing';
import { TasksRepository } from '../tasks.repository';
import { Task } from '../task.entity';
import { TaskStatus } from '../enums/task-status.enum';
import { NotFoundException } from '@nestjs/common';
import { TaskStatus as GrpcTaskStatus } from '../../proto/tasks/generated/tasks_service';

const mockTasksRepository = {
  createTask:
    jest.fn<
      (
        dto: { title: string; description: string },
        userId: string,
      ) => Promise<Task>
    >(),
  getTasks:
    jest.fn<
      (
        filter: { status?: TaskStatus; searchQuery?: string },
        userId: string,
      ) => Promise<Task[]>
    >(),
  findOne: jest.fn<() => Promise<Task | null>>(),
  delete: jest.fn<() => Promise<{ affected: number }>>(),
  updateTaskStatus:
    jest.fn<
      (id: string, userId: string, status: TaskStatus) => Promise<Task | null>
    >(),
};

const mockUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const mockTask = {
  id: '3f2c1b8a-9d4e-4f6a-8c1b-2a3b4c5d6e7f',
  title: 'Завязать тапки в узел',
  description: 'Не простая задача',
  status: TaskStatus.OPEN,
  userId: mockUserId,
} as Task;

const mockTaskWithStatusDone = { ...mockTask, status: TaskStatus.DONE };

describe('TaskService', () => {
  let service: TasksService;
  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TasksRepository,
          useValue: mockTasksRepository,
        },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  it('Возвращает задачу если она найдена', async () => {
    mockTasksRepository.findOne.mockResolvedValue(mockTask);

    const result = await service.getTaskById({
      id: mockTask.id,
      userId: mockUserId,
    });

    expect(result).toEqual({
      task: {
        id: mockTask.id,
        title: mockTask.title,
        description: mockTask.description,
        status: GrpcTaskStatus.TASK_STATUS_OPEN,
      },
    });
  });

  it('Бросает NotFoundException, если задача не найдена', async () => {
    mockTasksRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getTaskById({ id: mockTask.id, userId: mockUserId }),
    ).rejects.toThrow(NotFoundException);
  });

  it('Создаёт задачу со статусом OPEN', async () => {
    mockTasksRepository.createTask.mockResolvedValue(mockTask);

    const result = await service.createTask({
      title: mockTask.title,
      description: mockTask.description,
      userId: mockUserId,
    });

    expect(result).toEqual({
      task: {
        id: mockTask.id,
        title: mockTask.title,
        description: mockTask.description,
        status: GrpcTaskStatus.TASK_STATUS_OPEN,
      },
    });
    expect(mockTasksRepository.createTask).toHaveBeenCalledWith(
      { title: mockTask.title, description: mockTask.description },
      mockUserId,
    );
  });

  it('Пробрасывает ошибку репозитория при создании задачи', async () => {
    const error = new Error('Database error');
    mockTasksRepository.createTask.mockRejectedValue(error);

    await expect(
      service.createTask({
        title: mockTask.title,
        description: mockTask.description,
        userId: mockUserId,
      }),
    ).rejects.toBe(error);
  });

  it('Возвращает задачи без фильтров', async () => {
    mockTasksRepository.getTasks.mockResolvedValue([mockTask]);

    const result = await service.listTasks({ userId: mockUserId });

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks?.[0]?.status).toBe(GrpcTaskStatus.TASK_STATUS_OPEN);
    expect(mockTasksRepository.getTasks).toHaveBeenCalledWith(
      { status: undefined, searchQuery: undefined },
      mockUserId,
    );
  });

  it('Прокидывает фильтры статуса и поиска в репозиторий', async () => {
    mockTasksRepository.getTasks.mockResolvedValue([]);

    await service.listTasks({
      status: GrpcTaskStatus.TASK_STATUS_DONE,
      searchQuery: 'тапки',
      userId: mockUserId,
    });

    expect(mockTasksRepository.getTasks).toHaveBeenCalledWith(
      { status: TaskStatus.DONE, searchQuery: 'тапки' },
      mockUserId,
    );
  });

  it('Бросает ошибку при неизвестном статусе в listTasks', async () => {
    await expect(
      service.listTasks({
        status: 999,
        userId: mockUserId,
      }),
    ).rejects.toThrow('Unknown task status: 999');
  });

  it('Возвращает true, если задача принадлежит пользователю', async () => {
    mockTasksRepository.findOne.mockResolvedValue(mockTask);

    const result = await service.validateTaskOwner({
      taskId: mockTask.id,
      userId: mockUserId,
    });

    expect(result.isOwner).toBe(true);
    expect(mockTasksRepository.findOne).toHaveBeenCalledWith({
      where: { id: mockTask.id, userId: mockUserId },
    });
  });

  it('Возвращает false, если задача не принадлежит пользователю', async () => {
    mockTasksRepository.findOne.mockResolvedValue(null);

    const result = await service.validateTaskOwner({
      taskId: mockTask.id,
      userId: mockUserId,
    });

    expect(result.isOwner).toBe(false);
  });

  it('Удаляет задачу', async () => {
    mockTasksRepository.delete.mockResolvedValue({ affected: 1 });

    await expect(
      service.deleteTask({ id: mockTask.id, userId: mockUserId }),
    ).resolves.toEqual({});

    expect(mockTasksRepository.delete).toHaveBeenCalledWith({
      id: mockTask.id,
      userId: mockUserId,
    });
  });

  it('Пробрасывает ошибку репозитория при удалении задачи', async () => {
    const error = new Error('Database error');
    mockTasksRepository.delete.mockRejectedValue(error);

    await expect(
      service.deleteTask({ id: mockTask.id, userId: mockUserId }),
    ).rejects.toBe(error);
  });

  it('Обновляет статус задачи', async () => {
    mockTasksRepository.updateTaskStatus.mockResolvedValue(
      mockTaskWithStatusDone,
    );

    const { id } = mockTaskWithStatusDone;

    const result = await service.updateTaskStatus({
      id,
      status: GrpcTaskStatus.TASK_STATUS_DONE,
      userId: mockUserId,
    });

    expect(result.task?.status).toBe(GrpcTaskStatus.TASK_STATUS_DONE);
    expect(mockTasksRepository.updateTaskStatus).toHaveBeenCalledWith(
      id,
      mockUserId,
      TaskStatus.DONE,
    );
  });

  it('Бросает NotFoundException при обновлении, если задача не найдена', async () => {
    mockTasksRepository.updateTaskStatus.mockResolvedValue(null);

    await expect(
      service.updateTaskStatus({
        id: mockTask.id,
        status: GrpcTaskStatus.TASK_STATUS_DONE,
        userId: mockUserId,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
