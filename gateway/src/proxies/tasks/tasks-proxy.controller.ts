import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs';
import { AxiosResponse } from 'axios';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthedRequest } from '../../auth/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard)
export class TasksProxyController {
  private readonly logger = new Logger('TasksProxyController', {
    timestamp: true,
  });
  private readonly tasksServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.tasksServiceUrl = config.getOrThrow('TASKS_SERVICE_URL');
  }

  @ApiOperation({ summary: 'Создание задачи' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description'],
      properties: {
        title: {
          type: 'string',
          description: 'Название задачи',
          example: 'Подготовить документацию',
        },
        description: {
          type: 'string',
          description: 'Описание задачи',
          example: 'Добавить примеры запросов в Swagger',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Задача создана' })
  @ApiResponse({ status: 400, description: 'Некорректные данные задачи' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @Post()
  createTask(@Body() body: unknown, @Req() request: AuthedRequest) {
    this.logger.verbose(`Create task request: userId=${request.user.userId}`);
    return this.http
      .post(`${this.tasksServiceUrl}/tasks`, body, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @ApiOperation({ summary: 'Получение всех задач' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['OPEN', 'IN_PROGRESS', 'DONE'],
    description: 'Статус задачи',
  })
  @ApiQuery({
    name: 'searchQuery',
    required: false,
    type: String,
    description: 'Поиск по задачам',
  })
  @ApiResponse({ status: 200, description: 'Список задач' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @Get()
  getTasks(
    @Query() query: { status?: string; searchQuery?: string },
    @Req() request: AuthedRequest,
  ) {
    this.logger.verbose(`List tasks request: userId=${request.user.userId}`);
    return this.http
      .get(`${this.tasksServiceUrl}/tasks`, {
        params: {
          status: query.status,
          searchQuery: query.searchQuery,
        },
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @ApiOperation({ summary: 'Получение задачи по ID' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'UUID задачи',
  })
  @ApiResponse({ status: 200, description: 'Задача найдена' })
  @ApiResponse({ status: 400, description: 'Некорректный UUID задачи' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @Get(':id')
  getTask(@Param('id') id: string, @Req() request: AuthedRequest) {
    this.logger.verbose(
      `Get task request: taskId=${id}, userId=${request.user.userId}`,
    );
    return this.http
      .get(`${this.tasksServiceUrl}/tasks/${id}`, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @ApiOperation({ summary: 'Удаление задачи по ID' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'UUID задачи',
  })
  @ApiResponse({ status: 200, description: 'Задача удалена' })
  @ApiResponse({ status: 400, description: 'Некорректный UUID задачи' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @Delete(':id')
  deleteTask(@Param('id') id: string, @Req() request: AuthedRequest) {
    this.logger.verbose(
      `Delete task request: taskId=${id}, userId=${request.user.userId}`,
    );
    return this.http
      .delete(`${this.tasksServiceUrl}/tasks/${id}`, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @ApiOperation({ summary: 'Обновление статуса задачи' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['OPEN', 'IN_PROGRESS', 'DONE'],
          description: 'Новый статус задачи',
          example: 'IN_PROGRESS',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'UUID задачи',
  })
  @ApiResponse({ status: 200, description: 'Статус обновлён' })
  @ApiResponse({
    status: 400,
    description: 'Некорректный UUID задачи или status',
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @Patch(':id/status')
  updateTaskStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: AuthedRequest,
  ) {
    this.logger.verbose(
      `Update task status request: taskId=${id}, userId=${request.user.userId}`,
    );
    return this.http
      .patch(`${this.tasksServiceUrl}/tasks/${id}/status`, body, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
