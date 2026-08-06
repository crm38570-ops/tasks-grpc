import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  DeleteTaskDto,
  GetTasksFilterDto,
  UpdateTaskStatusDto,
} from './dto';
import { Task } from './task.entity';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../auth/user.entity';

@Controller('tasks')
@UseGuards(AuthGuard())
export class TasksController {
  private logger = new Logger(`TaskController`);

  constructor(private tasksService: TasksService) {}

  @Post()
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @GetUser() user: User,
  ): Promise<Task> {
    this.logger.verbose(
      `User "${user.username}" creating a new task. Data ${JSON.stringify(createTaskDto)}`,
    );
    return this.tasksService.createTask(createTaskDto, user);
  }

  @Get()
  getTasks(
    @Query() filterDto: GetTasksFilterDto,
    @GetUser() user: User,
  ): Promise<Task[]> {
    this.logger.verbose(
      `User "${user.username}" retrieving all tasks. Filters: ${JSON.stringify(filterDto)}`,
    );
    return this.tasksService.getTasks(filterDto, user);
  }

  @Get(':id')
  getTaskById(@Param('id') id: string, @GetUser() user: User): Promise<Task> {
    this.logger.verbose(
      `User "${user.username}" retrieving task with ID "${id}"`,
    );
    return this.tasksService.getTaskById(id, user);
  }

  @Delete(':id')
  deleteTaskById(
    @Param() id: DeleteTaskDto,
    @GetUser() user: User,
  ): Promise<void> {
    this.logger.verbose(
      `User "${user.username}" deleting task with ID "${id.id}"`,
    );
    return this.tasksService.deleteTaskById(id, user);
  }

  @Patch(':id/status')
  update(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @GetUser() user: User,
  ): Promise<Task> {
    this.logger.verbose(
      `User "${user.username}" updating task "${id}" status to "${updateTaskStatusDto.status}"`,
    );
    return this.tasksService.updateTaskStatus(
      id,
      updateTaskStatusDto.status,
      user,
    );
  }
}
