import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TasksProxyController } from './tasks-proxy.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [TasksProxyController],
})
export class TasksProxyModule {}
