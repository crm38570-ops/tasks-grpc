import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { CreateTaskDto, DeleteTaskDto, GetTasksFilterDto } from './dto';
import { TasksRepository } from './tasks.repository';
import { Task } from './task.entity';
import { TaskStatus } from './enums/task-status.enum';

@Injectable()
export class TasksService {
  private readonly logger = new Logger('TasksService', { timestamp: true });

  constructor(private tasksRepository: TasksRepository) {}

  createTask(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    this.logger.log(
      `Creating task for user "${userId}": ${createTaskDto.title}`,
    );
    return this.tasksRepository.createTask(createTaskDto, userId);
  }

  async getTasks(
    filterDto: GetTasksFilterDto,
    userId: string,
  ): Promise<Task[]> {
    this.logger.log(`Getting tasks for user "${userId}"`);
    return this.tasksRepository.getTasks(filterDto, userId);
  }

  async getTaskById(id: string, userId: string): Promise<Task> {
    this.logger.log(`Getting task "${id}" for user "${userId}"`);
    const found = await this.tasksRepository.findOne({
      where: { id, userId },
    });

    if (!found) {
      this.logger.warn(`Task "${id}" not found for user "${userId}"`);
      throw new NotFoundException('Task not found');
    }

    return found;
  }

  async deleteTaskById({ id }: DeleteTaskDto, userId: string): Promise<void> {
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
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    userId: string,
  ): Promise<Task> {
    this.logger.log(
      `Updating task "${id}" status to "${status}" for user "${userId}"`,
    );
    const task = await this.getTaskById(id, userId);
    task.status = status;

    return this.tasksRepository.updateTaskStatus(task);
  }
}
