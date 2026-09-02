import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthedRequest } from '../../auth/jwt-auth.guard';
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

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksProxyController {
  constructor(private readonly tasksProxyService: TasksProxyService) {}

  @CreateTaskApi()
  @Post()
  createTask(@Body() dto: CreateTaskDto, @Req() request: AuthedRequest) {
    return this.tasksProxyService.createTask(dto, request.user.userId);
  }

  @GetTasksApi()
  @Get()
  getTasks(@Query() filter: GetTasksFilterDto, @Req() request: AuthedRequest) {
    return this.tasksProxyService.getTasks(filter, request.user.userId);
  }

  @GetTaskByIdApi()
  @Get(':id')
  getTask(@Param() { id }: TaskIdParamDto, @Req() request: AuthedRequest) {
    return this.tasksProxyService.getTaskById(id, request.user.userId);
  }

  @DeleteTaskApi()
  @Delete(':id')
  deleteTask(@Param() { id }: TaskIdParamDto, @Req() request: AuthedRequest) {
    return this.tasksProxyService.deleteTask(id, request.user.userId);
  }

  @UpdateTaskStatusApi()
  @Patch(':id/status')
  updateTaskStatus(
    @Param() { id }: TaskIdParamDto,
    @Body() dto: UpdateTaskStatusDto,
    @Req() request: AuthedRequest,
  ) {
    return this.tasksProxyService.updateTaskStatus(
      id,
      dto,
      request.user.userId,
    );
  }
}
