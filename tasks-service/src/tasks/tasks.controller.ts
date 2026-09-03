import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { RpcValidationPipe } from '../pipes/validation.pipe';
import { UsePipes } from '@nestjs/common';
import {
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
  TasksServiceController,
  UpdateTaskStatusResponse,
} from '../proto/tasks/generated/tasks_service';

@Controller('tasks')
@UsePipes(RpcValidationPipe)
export class TasksController implements TasksServiceController {
  private readonly logger = new Logger('TasksController', { timestamp: true });

  constructor(private tasksService: TasksService) {}

  @GrpcMethod('TasksService', 'CreateTask')
  createTask(request: CreateTaskRequestDto): Promise<CreateTaskResponse> {
    this.logger.verbose(`Create task request: userId=${request.userId}`);
    return this.tasksService.createTask(request);
  }

  @GrpcMethod('TasksService', 'ListTasks')
  listTasks(request: ListTasksRequestDto): Promise<ListTasksResponse> {
    this.logger.verbose(`List tasks request: userId=${request.userId}`);
    return this.tasksService.listTasks(request);
  }

  @GrpcMethod('TasksService', 'GetTaskById')
  getTaskById(request: GetTaskByIdRequestDto): Promise<GetTaskByIdResponse> {
    this.logger.verbose(
      `Get task request: taskId=${request.id}, userId=${request.userId}`,
    );
    return this.tasksService.getTaskById(request);
  }

  @GrpcMethod('TasksService', 'DeleteTask')
  deleteTask(request: DeleteTaskRequestDto): Promise<DeleteTaskResponse> {
    this.logger.verbose(
      `Delete task request: taskId=${request.id}, userId=${request.userId}`,
    );
    return this.tasksService.deleteTask(request);
  }

  @GrpcMethod('TasksService', 'UpdateTaskStatus')
  updateTaskStatus(
    request: UpdateTaskStatusRequestDto,
  ): Promise<UpdateTaskStatusResponse> {
    this.logger.verbose(
      `Update task status request: taskId=${request.id}, userId=${request.userId}`,
    );
    return this.tasksService.updateTaskStatus(request);
  }
}
