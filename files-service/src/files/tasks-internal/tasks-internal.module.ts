import { Module } from '@nestjs/common';
import { ClientProxyFactory } from '@nestjs/microservices';
import { tasksInternalGrpcClientOptions } from './options/grpc-client.options';
import { TaskOwnershipService } from './task-ownership.service';

@Module({
  providers: [
    TaskOwnershipService,
    {
      provide: 'TASKS_INTERNAL_GRPC_CLIENT',
      useFactory: () =>
        ClientProxyFactory.create(tasksInternalGrpcClientOptions),
    },
  ],
  exports: [TaskOwnershipService],
})
export class TasksInternalModule {}
