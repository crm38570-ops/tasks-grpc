import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';
import { TasksInternalServiceClient } from '../../proto/tasks_internal/generated/tasks_internal_service';

@Injectable()
export class TaskOwnershipService implements OnModuleInit {
  private readonly logger = new Logger('TaskOwnershipService', {
    timestamp: true,
  });
  private tasksInternalService!: TasksInternalServiceClient;

  constructor(
    @Inject('TASKS_INTERNAL_GRPC_CLIENT') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.tasksInternalService =
      this.client.getService<TasksInternalServiceClient>('TasksInternalService');
  }

  async validateTaskOwner(taskId: string, userId: string): Promise<void> {
    this.logger.verbose(`Validate task owner: taskId=${taskId}, userId=${userId}`);

    const response = await lastValueFrom(
      this.tasksInternalService.validateTaskOwner({ taskId, userId }),
    );

    if (!response.isOwner) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Задача не найдена или недоступна пользователю',
      });
    }
  }
}
