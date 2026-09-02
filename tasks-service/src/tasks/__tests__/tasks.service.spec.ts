import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TasksService } from '../tasks.service';
import { Test } from '@nestjs/testing';
import { TasksRepository } from '../tasks.repository';
import { Task } from '../task.entity';
import { TaskStatus } from '../enums/task-status.enum';
import { NotFoundException } from '@nestjs/common';
import { TaskStatus as GrpcTaskStatus } from '../../proto/tasks/generated/tasks_service';

const mockTasksRepository = {
  findOne: jest.fn<() => Promise<Task | null>>(),
  delete: jest.fn<() => Promise<{ affected: number }>>(),
  updateTaskStatus: jest.fn<(task: Task) => Promise<Task>>(),
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
    mockTasksRepository.findOne.mockResolvedValue(mockTask);
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
      mockTaskWithStatusDone,
    );
  });
});
