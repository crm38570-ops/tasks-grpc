import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsePipes } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { RpcValidationPipe } from '../pipes/validation.pipe';
import { ValidateTaskOwnerRequestDto } from './dto';
import type {
  TasksInternalServiceController,
  ValidateTaskOwnerResponse,
} from '../proto/tasks_internal/generated/tasks_internal_service';

@Controller('tasks-internal')
@UsePipes(RpcValidationPipe)
export class TasksInternalController implements TasksInternalServiceController {
  private readonly logger = new Logger('TasksInternalController', {
    timestamp: true,
  });

  constructor(private tasksService: TasksService) {}

  @GrpcMethod('TasksInternalService', 'ValidateTaskOwner')
  validateTaskOwner(
    request: ValidateTaskOwnerRequestDto,
  ): Promise<ValidateTaskOwnerResponse> {
    this.logger.verbose(
      `Validate task owner request: taskId=${request.taskId}, userId=${request.userId}`,
    );
    return this.tasksService.validateTaskOwner(request);
  }
}
