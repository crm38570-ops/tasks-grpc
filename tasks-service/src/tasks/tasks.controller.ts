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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUserId } from '../decorators/get-user-id.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  private readonly logger = new Logger('TasksController', { timestamp: true });

  constructor(private tasksService: TasksService) {}

  @ApiOperation({ summary: 'Создание задачи' })
  @ApiResponse({
    status: 201,
    description: 'Задача создана',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные: пустой title или description',
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
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

  @ApiOperation({ summary: 'Получение всех задач' })
  @ApiQuery({
    type: GetTasksFilterDto,
    description:
      'Фильтры: status (OPEN/IN_PROGRESS/DONE) и searchQuery (поиск по title/description)',
  })
  @ApiResponse({
    status: 200,
    description: 'Массив задач (может быть пустым)',
    type: TaskResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные query-параметры',
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
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
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Задача не найдена или не принадлежит пользователю',
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @Get(':id')
  getTaskById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @GetUserId() userId: string,
  ): Promise<TaskResponseDto> {
    this.logger.verbose(`User "${userId}" retrieving task with ID "${id}"`);
    return this.tasksService.getTaskById(id, userId);
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
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @Delete(':id')
  deleteTaskById(
    @Param() id: DeleteTaskDto,
    @GetUserId() userId: string,
  ): Promise<void> {
    this.logger.verbose(`User "${userId}" deleting task with ID "${id.id}"`);
    return this.tasksService.deleteTaskById(id, userId);
  }

  @ApiOperation({ summary: 'Обновление статуса задачи' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID задачи',
  })
  @ApiResponse({
    status: 200,
    description: 'Статус обновлён',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный status',
  })
  @ApiResponse({
    status: 404,
    description: 'Задача не найдена или не принадлежит пользователю',
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
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
