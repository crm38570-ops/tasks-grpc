import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { TasksProxyController } from './tasks-proxy.controller';
import { TasksProxyService } from './tasks-proxy.service';
import { tasksGrpcClientOptions } from './options/grpc-client.options';

@Module({
  imports: [ConfigModule],
  controllers: [TasksProxyController],
  providers: [
    TasksProxyService,
    {
      provide: 'TASKS_GRPC_CLIENT',
      useFactory: () => ClientProxyFactory.create(tasksGrpcClientOptions),
    },
  ],
})
export class TasksProxyModule {}
