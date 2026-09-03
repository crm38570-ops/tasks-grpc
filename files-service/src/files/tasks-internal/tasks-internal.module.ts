import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { tasksInternalGrpcClientOptions } from './options/grpc-client.options';
import { TaskOwnershipService } from './task-ownership.service';

@Module({
  imports: [ConfigModule],
  providers: [
    TaskOwnershipService,
    {
      provide: 'TASKS_INTERNAL_GRPC_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create(
          tasksInternalGrpcClientOptions(configService),
        ),
    },
  ],
  exports: [TaskOwnershipService],
})
export class TasksInternalModule {}
