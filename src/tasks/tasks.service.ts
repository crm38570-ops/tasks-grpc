import { Injectable } from '@nestjs/common';
import { CreateTaskDto, DeleteTaskDto, GetTasksFilterDto } from './dto';
import { NotFoundException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
import { User } from '../auth/user.entity';

@Injectable()
export class TasksService {
  constructor(private tasksRepository: TasksRepository) {}

  createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    return this.tasksRepository.createTask(createTaskDto, user);
  }

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    return this.tasksRepository.getTasks(filterDto, user);
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    const found = await this.tasksRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!found) throw new NotFoundException('Task not found');

    return found;
  }

  async deleteTaskById({ id }: DeleteTaskDto, user: User): Promise<void> {
    const result = await this.tasksRepository.delete({ id, user });

    if (!result.affected)
      throw new NotFoundException(`Task with ID ${id} not found`);
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);
    task.status = status;

    return this.tasksRepository.updateTaskStatus(task);
  }
}
