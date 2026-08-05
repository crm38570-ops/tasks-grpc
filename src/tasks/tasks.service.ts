import { Injectable } from '@nestjs/common';
import { CreateTaskDto, DeleteTaskDto, GetTasksFilterDto } from './dto';
import { NotFoundException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';

@Injectable()
export class TasksService {
  constructor(private tasksRepository: TasksRepository) {}

  createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksRepository.createTask(createTaskDto);
  }

  async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
    return this.tasksRepository.getTasks(filterDto);
  }

  async getTaskById(id: string): Promise<Task> {
    const found = await this.tasksRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!found) throw new NotFoundException('Task not found');

    return found;
  }

  async deleteTaskById({ id }: DeleteTaskDto): Promise<void> {
    const result = await this.tasksRepository.delete(id);

    if (!result.affected)
      throw new NotFoundException(`Task with ID ${id} not found`);
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const task = await this.getTaskById(id);
    task.status = status;

    return this.tasksRepository.updateTaskStatus(task);
  }
}
