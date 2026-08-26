import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  DeleteTaskDto,
  GetTasksFilterDto,
  TaskResponseDto,
  UpdateTaskStatusDto,
} from './dto';
import { GetUserId } from '../decorators/get-user-id.decorator';

@Controller('tasks')
export class TasksController {
  private readonly logger = new Logger('TasksController', { timestamp: true });

  constructor(private tasksService: TasksService) {}

  @Post()
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @GetUserId() userId: string,
  ): Promise<TaskResponseDto> {
    this.logger.verbose(
      `User "${userId}" creating a new task. Data ${JSON.stringify(createTaskDto)}`,
    );
    return this.tasksService.createTask(createTaskDto, userId);
  }

  @Get()
  getTasks(
    @Query() filterDto: GetTasksFilterDto,
    @GetUserId() userId: string,
  ): Promise<TaskResponseDto[]> {
    this.logger.verbose(
      `User "${userId}" retrieving all tasks. Filters: ${JSON.stringify(filterDto)}`,
    );
    return this.tasksService.getTasks(filterDto, userId);
  }

  @Get(':id')
  getTaskById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUserId() userId: string,
  ): Promise<TaskResponseDto> {
    this.logger.verbose(`User "${userId}" retrieving task with ID "${id}"`);
    return this.tasksService.getTaskById(id, userId);
  }

  @Delete(':id')
  deleteTaskById(
    @Param() id: DeleteTaskDto,
    @GetUserId() userId: string,
  ): Promise<void> {
    this.logger.verbose(`User "${userId}" deleting task with ID "${id.id}"`);
    return this.tasksService.deleteTaskById(id, userId);
  }

  @Patch(':id/status')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @GetUserId() userId: string,
  ): Promise<TaskResponseDto> {
    this.logger.verbose(
      `User "${userId}" updating task "${id}" status to "${updateTaskStatusDto.status}"`,
    );
    return this.tasksService.updateTaskStatus(
      id,
      updateTaskStatusDto.status,
      userId,
    );
  }
}
