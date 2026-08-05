import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto, GetTasksFilterDto } from './dto';
import { TaskStatus } from './task-status.enum';

@Injectable()
export class TasksRepository extends Repository<Task> {
  constructor(private dataSource: DataSource) {
    super(Task, dataSource.createEntityManager());
  }

  async createTask({ title, description }: CreateTaskDto): Promise<Task> {
    const task = this.create({
      title,
      description,
      status: TaskStatus.OPEN,
    });

    await this.save(task);

    return task;
  }

  async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
    const { status, searchQuery } = filterDto;

    const query = this.createQueryBuilder('task');

    if (status) query.andWhere('task.status = :status', { status });

    if (searchQuery)
      query.andWhere(
        'LOWER(task.title) LIKE LOWER(:searchQuery) OR LOWER(task.description) LIKE LOWER(:searchQuery)',
        { searchQuery: `%${searchQuery}%` },
      );

    const tasks = await query.getMany();

    return tasks;
  }

  async getTaskById(id: string) {
    return this.findOne({ where: { id } });
  }

  async deleteTaskById(id: string) {
    return this.delete(id);
  }

  async updateTaskStatus(task: Task): Promise<Task> {
    return await this.save(task);
  }
}
