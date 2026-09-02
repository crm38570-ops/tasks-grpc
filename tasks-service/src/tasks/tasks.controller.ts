import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { TaskStatus } from './enums/task-status.enum';
import type {
  CreateTaskRequest,
  CreateTaskResponse,
  DeleteTaskRequest,
  DeleteTaskResponse,
  GetTaskByIdRequest,
  GetTaskByIdResponse,
  ListTasksRequest,
  ListTasksResponse,
  TaskResponse,
  UpdateTaskStatusRequest,
  UpdateTaskStatusResponse,
} from '../proto/tasks/generated/tasks_service';
import { TasksServiceController } from '../proto/tasks/generated/tasks_service';
import { TaskStatus as GrpcTaskStatus } from '../proto/tasks/generated/tasks_service';

const toGrpcStatus = (status: TaskStatus): GrpcTaskStatus =>
  GrpcTaskStatus[`TASK_STATUS_${status}` as keyof typeof GrpcTaskStatus];

const toEntityStatus = (status: GrpcTaskStatus): TaskStatus =>
  GrpcTaskStatus[status].replace('TASK_STATUS_', '') as TaskStatus;

const toTaskResponse = (task: Task): TaskResponse => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: toGrpcStatus(task.status),
});

@Controller('tasks')
export class TasksController implements TasksServiceController {
  private readonly logger = new Logger('TasksController', { timestamp: true });

  constructor(private tasksService: TasksService) {}

  @GrpcMethod('TasksService', 'CreateTask')
  createTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    const { title, description, userId } = request;
    this.logger.verbose(`User "${userId}" creating a new task. Data: ${title}`);
    return this.tasksService
      .createTask({ title, description }, userId)
      .then((task) => ({ task: toTaskResponse(task) }));
  }

  @GrpcMethod('TasksService', 'ListTasks')
  async listTasks(request: ListTasksRequest): Promise<ListTasksResponse> {
    const { status, searchQuery, userId } = request;
    this.logger.verbose(
      `User "${userId}" retrieving all tasks. Filters: status=${status ?? 'any'}, searchQuery=${searchQuery}`,
    );
    const tasks = await this.tasksService.getTasks(
      {
        status: status === undefined ? undefined : toEntityStatus(status),
        searchQuery: searchQuery || undefined,
      },
      userId,
    );
    return { tasks: tasks.map(toTaskResponse) };
  }

  @GrpcMethod('TasksService', 'GetTaskById')
  async getTaskById(request: GetTaskByIdRequest): Promise<GetTaskByIdResponse> {
    const { id, userId } = request;
    this.logger.verbose(`User "${userId}" retrieving task with ID "${id}"`);
    const task = await this.tasksService.getTaskById(id, userId);
    return { task: toTaskResponse(task) };
  }

  @GrpcMethod('TasksService', 'DeleteTask')
  async deleteTask(request: DeleteTaskRequest): Promise<DeleteTaskResponse> {
    const { id, userId } = request;
    this.logger.verbose(`User "${userId}" deleting task with ID "${id}"`);
    await this.tasksService.deleteTaskById({ id }, userId);
    return {};
  }

  @GrpcMethod('TasksService', 'UpdateTaskStatus')
  async updateTaskStatus(
    request: UpdateTaskStatusRequest,
  ): Promise<UpdateTaskStatusResponse> {
    const { id, status, userId } = request;
    this.logger.verbose(
      `User "${userId}" updating task "${id}" status to "${status}"`,
    );
    const task = await this.tasksService.updateTaskStatus(
      id,
      toEntityStatus(status),
      userId,
    );
    return { task: toTaskResponse(task) };
  }
}
