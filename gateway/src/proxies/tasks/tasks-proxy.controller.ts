import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs';
import { AxiosResponse } from 'axios';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthedRequest } from '../../auth/jwt-auth.guard';

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

  @Post()
  createTask(@Body() body: unknown, @Req() request: AuthedRequest) {
    this.logger.verbose(`Create task request: userId=${request.user.userId}`);
    return this.http
      .post(`${this.tasksServiceUrl}/tasks`, body, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get()
  getTasks(@Req() request: AuthedRequest) {
    this.logger.verbose(`List tasks request: userId=${request.user.userId}`);
    return this.http
      .get(`${this.tasksServiceUrl}/tasks`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get(':id')
  getTask(@Param('id') id: string, @Req() request: AuthedRequest) {
    this.logger.verbose(
      `Get task request: taskId=${id}, userId=${request.user.userId}`,
    );
    return this.http
      .get(`${this.tasksServiceUrl}/tasks/${id}`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string, @Req() request: AuthedRequest) {
    this.logger.verbose(
      `Delete task request: taskId=${id}, userId=${request.user.userId}`,
    );
    return this.http
      .delete(`${this.tasksServiceUrl}/tasks/${id}`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

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
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
