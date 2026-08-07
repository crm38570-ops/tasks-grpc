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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(AuthGuard())
export class TasksController {
  private logger = new Logger(`TaskController`);

  constructor(private tasksService: TasksService) {}

  @ApiOperation({ summary: 'Создание задачи' })
  @ApiBody({
    type: CreateTaskDto,
    description: 'Данные новой задачи',
    examples: {
      capybaras: {
        value: {
          title: 'Написать диссертацию',
          description:
            '"Капибары, почему все мы их так любим?". Использовать ChatGPT 5.6 Sol для максимального погружения в тему',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Задача создана',
    type: Task,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные: пустой title или description',
  })
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

  @ApiOperation({ summary: 'Получение всех задач' })
  @ApiQuery({
    type: GetTasksFilterDto,
    description:
      'Фильтры: status (OPEN/IN_PROGRESS/DONE) и searchQuery (поиск по title/description)',
  })
  @ApiResponse({
    status: 200,
    description: 'Массив задач (может быть пустым)',
    type: Task,
    isArray: true,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные query-параметры',
  })
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

  @ApiOperation({ summary: 'Получение задачи по ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID задачи',
  })
  @ApiResponse({
    status: 200,
    description: 'Задача найдена',
    type: Task,
  })
  @ApiResponse({
    status: 404,
    description: 'Задача не найдена или не принадлежит пользователю',
  })
  @Get(':id')
  getTaskById(@Param('id') id: string, @GetUser() user: User): Promise<Task> {
    this.logger.verbose(
      `User "${user.username}" retrieving task with ID "${id}"`,
    );
    return this.tasksService.getTaskById(id, user);
  }

  @ApiOperation({ summary: 'Удаление задачи по ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID задачи',
  })
  @ApiResponse({
    status: 200,
    description: 'Задача удалена',
  })
  @ApiResponse({
    status: 404,
    description: 'Задача не найдена или не принадлежит пользователю',
  })
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

  @ApiOperation({ summary: 'Обновление статуса задачи' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID задачи',
  })
  @ApiBody({
    type: UpdateTaskStatusDto,
    description: 'Новый статус задачи',
    examples: {
      OPEN: { value: { status: 'OPEN' } },
      IN_PROGRESS: { value: { status: 'IN_PROGRESS' } },
      DONE: { value: { status: 'DONE' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Статус обновлён',
    type: Task,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный status',
  })
  @ApiResponse({
    status: 404,
    description: 'Задача не найдена или не принадлежит пользователю',
  })
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
