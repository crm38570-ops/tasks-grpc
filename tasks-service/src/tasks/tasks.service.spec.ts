import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TasksService } from './tasks.service';
import { Test } from '@nestjs/testing';
import { TasksRepository } from './tasks.repository';
import { User } from '../auth/user.entity';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
import { NotFoundException } from '@nestjs/common';

const mockTasksRepository = {
  findOne: jest.fn<() => Promise<Task | null>>(),
  delete: jest.fn<() => Promise<{ affected: number }>>(),
  updateTaskStatus: jest.fn<(task: Task) => Promise<Task>>(),
};

const mockUser = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  username: 'test_user',
} as User;

const mockTask = {
  id: '3f2c1b8a-9d4e-4f6a-8c1b-2a3b4c5d6e7f',
  title: 'Завязать тапки в узел',
  description: 'Не простая задача',
  status: TaskStatus.OPEN,
  user: mockUser,
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

    const result = await service.getTaskById(mockTask.id, mockUser);

    expect(result).toEqual(mockTask);
  });

  it('Бросает NotFoundException, если задача не найдена', async () => {
    mockTasksRepository.findOne.mockResolvedValue(null);

    await expect(service.getTaskById(mockTask.id, mockUser)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Обновляет статус задачи', async () => {
    mockTasksRepository.findOne.mockResolvedValue(mockTask);
    mockTasksRepository.updateTaskStatus.mockResolvedValue(
      mockTaskWithStatusDone,
    );

    const { id, status } = mockTaskWithStatusDone;

    const result = await service.updateTaskStatus(id, status, mockUser);

    expect(result.status).toBe(mockTaskWithStatusDone.status);
    expect(mockTasksRepository.updateTaskStatus).toHaveBeenCalledWith(
      mockTaskWithStatusDone,
    );
  });
});
