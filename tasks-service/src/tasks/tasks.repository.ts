import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto, GetTasksFilterDto } from './dto';
import { TaskStatus } from './enums/task-status.enum';

@Injectable()
export class TasksRepository extends Repository<Task> {
  private logger = new Logger(`TaskRepository`, { timestamp: true });

  constructor(private readonly dataSource: DataSource) {
    super(Task, dataSource.createEntityManager());
  }

  async createTask(
    { title, description }: CreateTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = this.create({
      title,
      description,
      status: TaskStatus.OPEN,
      userId,
    });

    try {
      await this.save(task);
    } catch (error) {
      this.logger.error(
        `Failed to create task for userId "${userId}": ${title}`,
        error,
      );
      throw new InternalServerErrorException();
    }

    this.logger.log(`Task "${task.title}" created for user "${userId}"`);

    return task;
  }

  async getTasks(
    filterDto: GetTasksFilterDto,
    userId: string,
  ): Promise<Task[]> {
    const { status, searchQuery } = filterDto;

    const query = this.createQueryBuilder('task');

    query.where({ userId });

    if (status) query.andWhere('task.status = :status', { status });

    if (searchQuery)
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:searchQuery) OR LOWER(task.description) LIKE LOWER(:searchQuery))',
        { searchQuery: `%${searchQuery}%` },
      );

    try {
      const tasks = await query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for userId "${userId}". Filters: ${JSON.stringify(filterDto)}`,
        error,
      );
      throw new InternalServerErrorException();
    }
  }

  async getTaskById(id: string) {
    return this.findOne({ where: { id } });
  }

  async deleteTaskById(id: string) {
    return this.delete(id);
  }

  async updateTaskStatus(task: Task): Promise<Task> {
    let saved: Task;

    try {
      saved = await this.save(task);
    } catch (error) {
      this.logger.error(
        `Failed to update task "${task.id}" status to "${task.status}"`,
        error,
      );
      throw new InternalServerErrorException();
    }

    this.logger.log(
      `Task "${saved.title}" status updated to "${saved.status}"`,
    );
    return saved;
  }
}
