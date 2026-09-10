import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksProxyService } from './tasks-proxy.service';
import {
  CreateTaskDto,
  GetTasksFilterDto,
  TaskIdParamDto,
  UpdateTaskStatusDto,
} from './dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateTaskApi,
  DeleteTaskApi,
  GetTaskByIdApi,
  GetTasksApi,
  UpdateTaskStatusApi,
} from './swagger';
import { GetUserId } from './decorators/get.user.id';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksProxyController {
  constructor(private readonly tasksProxyService: TasksProxyService) {}

  @CreateTaskApi()
  @Post()
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @GetUserId() userId: string,
  ) {
    return this.tasksProxyService.createTask(createTaskDto, userId);
  }

  @GetTasksApi()
  @Get()
  getTasks(@Query() filter: GetTasksFilterDto, @GetUserId() userId: string) {
    return this.tasksProxyService.getTasks(filter, userId);
  }

  @GetTaskByIdApi()
  @Get(':id')
  getTask(@Param() { id }: TaskIdParamDto, @GetUserId() userId: string) {
    return this.tasksProxyService.getTaskById(id, userId);
  }

  @DeleteTaskApi()
  @Delete(':id')
  deleteTask(@Param() { id }: TaskIdParamDto, @GetUserId() userId: string) {
    return this.tasksProxyService.deleteTask(id, userId);
  }

  @UpdateTaskStatusApi()
  @Patch(':id/status')
  updateTaskStatus(
    @Param() { id }: TaskIdParamDto,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @GetUserId() userId: string,
  ) {
    return this.tasksProxyService.updateTaskStatus(
      id,
      updateTaskStatusDto,
      userId,
    );
  }
}
