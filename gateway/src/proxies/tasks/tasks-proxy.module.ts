import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TasksProxyController } from './tasks-proxy.controller';

@Module({
  imports: [HttpModule],
  controllers: [TasksProxyController],
})
export class TasksProxyModule {}
