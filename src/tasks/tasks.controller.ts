import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  DeleteTaskDto,
  GetTasksFilterDto,
  UpdateTaskStatusDto,
} from './dto';
import { Task } from './task.entity';

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksService.createTask(createTaskDto);
  }

  @Get()
  getTasks(@Query() filterDto: GetTasksFilterDto): Promise<Task[]> {
    return this.tasksService.getTasks(filterDto);
  }

  @Get(':id')
  getTaskById(@Param('id') id: string): Promise<Task> {
    return this.tasksService.getTaskById(id);
  }

  @Delete(':id')
  deleteTaskById(@Param() id: DeleteTaskDto): Promise<void> {
    return this.tasksService.deleteTaskById(id);
  }

  @Patch(':id/status')
  update(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ): Promise<Task> {
    return this.tasksService.updateTaskStatus(id, updateTaskStatusDto.status);
  }
}
