import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { TasksRepository } from './tasks.repository';
import { Task } from './task.entity';
import { toEntityStatus, toTaskResponse } from './services';
import type {
  CreateTaskRequestDto,
  DeleteTaskRequestDto,
  GetTaskByIdRequestDto,
  ListTasksRequestDto,
  UpdateTaskStatusRequestDto,
} from './dto';
import type {
  CreateTaskResponse,
  DeleteTaskResponse,
  GetTaskByIdResponse,
  ListTasksResponse,
  UpdateTaskStatusResponse,
} from '../proto/tasks/generated/tasks_service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger('TasksService', { timestamp: true });

  constructor(private tasksRepository: TasksRepository) {}

  async createTask(request: CreateTaskRequestDto): Promise<CreateTaskResponse> {
    const { title, description, userId } = request;
    this.logger.log(`Creating task for user "${userId}": ${title}`);
    const task = await this.tasksRepository.createTask(
      { title, description },
      userId,
    );
    return { task: toTaskResponse(task) };
  }

  async listTasks(request: ListTasksRequestDto): Promise<ListTasksResponse> {
    const { status, searchQuery, userId } = request;
    this.logger.log(
      `Getting tasks for user "${userId}" with filters: status=${status ?? 'any'}, searchQuery=${searchQuery}`,
    );
    const tasks = await this.tasksRepository.getTasks(
      {
        status: status === undefined ? undefined : toEntityStatus(status),
        searchQuery: searchQuery || undefined,
      },
      userId,
    );
    return { tasks: tasks.map(toTaskResponse) };
  }

  async getTaskById(
    request: GetTaskByIdRequestDto,
  ): Promise<GetTaskByIdResponse> {
    const { id, userId } = request;
    this.logger.log(`Getting task "${id}" for user "${userId}"`);
    const found = await this.tasksRepository.findOne({
      where: { id, userId },
    });

    if (!found) {
      this.logger.warn(`Task "${id}" not found for user "${userId}"`);
      throw new NotFoundException('Task not found');
    }

    return { task: toTaskResponse(found) };
  }

  async deleteTask(request: DeleteTaskRequestDto): Promise<DeleteTaskResponse> {
    const { id, userId } = request;
    this.logger.log(`Deleting task "${id}" for user "${userId}"`);

    let result: DeleteResult;
    try {
      result = await this.tasksRepository.delete({ id, userId });
    } catch (error) {
      this.logger.error(
        `Failed to delete task "${id}" for user "${userId}"`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    if (!result.affected) {
      this.logger.warn(`Task "${id}" not found for deletion`);
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    this.logger.log(`Task "${id}" deleted for user "${userId}"`);
    return {};
  }

  async updateTaskStatus(
    request: UpdateTaskStatusRequestDto,
  ): Promise<UpdateTaskStatusResponse> {
    const { id, status, userId } = request;
    this.logger.log(
      `Updating task "${id}" status to "${status}" for user "${userId}"`,
    );
    const task = await this.getTaskEntityById(id, userId);
    task.status = toEntityStatus(status);

    const updated = await this.tasksRepository.updateTaskStatus(task);
    return { task: toTaskResponse(updated) };
  }

  private async getTaskEntityById(id: string, userId: string): Promise<Task> {
    const found = await this.tasksRepository.findOne({
      where: { id, userId },
    });

    if (!found) {
      this.logger.warn(`Task "${id}" not found for user "${userId}"`);
      throw new NotFoundException('Task not found');
    }

    return found;
  }
}
