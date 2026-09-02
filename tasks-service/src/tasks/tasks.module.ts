import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksInternalController } from './tasks-internal.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TasksController, TasksInternalController],
  providers: [TasksService, TasksRepository],
  exports: [TasksService],
})
export class TasksModule {}
