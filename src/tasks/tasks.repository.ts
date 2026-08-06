import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto, GetTasksFilterDto } from './dto';
import { TaskStatus } from './task-status.enum';
import { User } from '../auth/user.entity';

@Injectable()
export class TasksRepository extends Repository<Task> {
  private logger = new Logger(`TaskRepository`, { timestamp: true });

  constructor(private dataSource: DataSource) {
    super(Task, dataSource.createEntityManager());
  }

  async createTask(
    { title, description }: CreateTaskDto,
    user: User,
  ): Promise<Task> {
    const task = this.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });

    await this.save(task);

    this.logger.log(`Task "${task.title}" created for user "${user.username}"`);

    return task;
  }

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, searchQuery } = filterDto;

    const query = this.createQueryBuilder('task');

    query.where({ user });

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
        `Failed to get tasks for user "${user.username}". Filters: ${JSON.stringify(filterDto)}`,
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
    const saved = await this.save(task);
    this.logger.log(
      `Task "${saved.title}" status updated to "${saved.status}"`,
    );
    return saved;
  }
}
