import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { TasksServiceClient } from '../../proto/tasks/generated/tasks_service';
import type {
  CreateTaskDto,
  GetTasksFilterDto,
  UpdateTaskStatusDto,
} from './dto';
import { mapTask, toGrpcStatus } from './mappers';
import { withDeadline } from '../shared/with-deadline';

@Injectable()
export class TasksProxyService implements OnModuleInit {
  private readonly logger = new Logger('TasksProxyService', {
    timestamp: true,
  });
  private readonly grpcTimeoutMs: number;
  private tasksService!: TasksServiceClient;

  constructor(
    @Inject('TASKS_GRPC_CLIENT') private readonly client: ClientGrpc,
    configService: ConfigService,
  ) {
    this.grpcTimeoutMs = configService.getOrThrow<number>('GRPC_TIMEOUT_MS');
  }

  onModuleInit() {
    this.tasksService =
      this.client.getService<TasksServiceClient>('TasksService');
  }

  async createTask(
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<unknown> {
    const { title, description } = createTaskDto;
    this.logger.verbose(`Create task request: userId=${userId}`);
    const response = await lastValueFrom(
      withDeadline(
        this.tasksService.createTask({ title, description, userId }),
        this.grpcTimeoutMs,
      ),
    );
    return mapTask(response.task);
  }

  async getTasks(filter: GetTasksFilterDto, userId: string): Promise<unknown> {
    this.logger.verbose(
      `List tasks request: userId=${userId}, status=${filter.status ?? 'any'}`,
    );
    const response = await lastValueFrom(
      withDeadline(
        this.tasksService.listTasks({
          status:
            filter.status === undefined
              ? undefined
              : toGrpcStatus(filter.status),
          searchQuery: filter.searchQuery ?? '',
          userId,
        }),
        this.grpcTimeoutMs,
      ),
    );
    return { tasks: response.tasks.map(mapTask) };
  }

  async getTaskById(id: string, userId: string): Promise<unknown> {
    this.logger.verbose(`Get task request: taskId=${id}, userId=${userId}`);
    const response = await lastValueFrom(
      withDeadline(
        this.tasksService.getTaskById({ id, userId }),
        this.grpcTimeoutMs,
      ),
    );
    return mapTask(response.task);
  }

  async deleteTask(id: string, userId: string): Promise<unknown> {
    this.logger.verbose(`Delete task request: taskId=${id}, userId=${userId}`);
    return lastValueFrom(
      withDeadline(
        this.tasksService.deleteTask({ id, userId }),
        this.grpcTimeoutMs,
      ),
    );
  }

  async updateTaskStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    userId: string,
  ): Promise<unknown> {
    const { status } = updateTaskStatusDto;
    this.logger.verbose(
      `Update task status request: taskId=${id}, userId=${userId}, status=${status}`,
    );
    const response = await lastValueFrom(
      withDeadline(
        this.tasksService.updateTaskStatus({
          id,
          status: toGrpcStatus(status),
          userId,
        }),
        this.grpcTimeoutMs,
      ),
    );
    return mapTask(response.task);
  }
}
