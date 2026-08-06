import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTaskDto, DeleteTaskDto, GetTasksFilterDto } from './dto';
import { TasksRepository } from './tasks.repository';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
import { User } from '../auth/user.entity';

@Injectable()
export class TasksService {
  private logger = new Logger(`TaskService`);

  constructor(private tasksRepository: TasksRepository) {}

  createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    this.logger.log(
      `Creating task for user "${user.username}": ${createTaskDto.title}`,
    );
    return this.tasksRepository.createTask(createTaskDto, user);
  }

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    this.logger.log(`Getting tasks for user "${user.username}"`);
    return this.tasksRepository.getTasks(filterDto, user);
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    this.logger.log(`Getting task "${id}" for user "${user.username}"`);
    const found = await this.tasksRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!found) {
      this.logger.warn(`Task "${id}" not found for user "${user.username}"`);
      throw new NotFoundException('Task not found');
    }

    return found;
  }

  async deleteTaskById({ id }: DeleteTaskDto, user: User): Promise<void> {
    this.logger.log(`Deleting task "${id}" for user "${user.username}"`);
    const result = await this.tasksRepository.delete({ id, user });

    if (!result.affected) {
      this.logger.warn(`Task "${id}" not found for deletion`);
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    this.logger.log(
      `Updating task "${id}" status to "${status}" for user "${user.username}"`,
    );
    const task = await this.getTaskById(id, user);
    task.status = status;

    return this.tasksRepository.updateTaskStatus(task);
  }
}
