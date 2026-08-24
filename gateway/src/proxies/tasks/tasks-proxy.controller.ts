import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs';
import { AxiosResponse } from 'axios';
import type { Request } from 'express';

@Controller('tasks')
export class TasksProxyController {
  private readonly tasksServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.tasksServiceUrl = config.getOrThrow('TASKS_SERVICE_URL');
  }

  @Post()
  createTask(@Body() body: unknown, @Req() request: Request) {
    return this.http
      .post(`${this.tasksServiceUrl}/tasks`, body, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get()
  getTasks(@Req() request: Request) {
    return this.http
      .get(`${this.tasksServiceUrl}/tasks`, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get(':id')
  getTask(@Param('id') id: string, @Req() request: Request) {
    return this.http
      .get(`${this.tasksServiceUrl}/tasks/${id}`, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string, @Req() request: Request) {
    return this.http
      .delete(`${this.tasksServiceUrl}/tasks/${id}`, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Patch(':id/status')
  updateTaskStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.http
      .patch(`${this.tasksServiceUrl}/tasks/${id}/status`, body, {
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
