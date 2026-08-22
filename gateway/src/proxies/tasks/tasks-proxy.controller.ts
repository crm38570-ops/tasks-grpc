import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs';
import { AxiosResponse } from 'axios';

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
  createTask(@Body() body: unknown) {
    return this.http
      .post(`${this.tasksServiceUrl}/tasks`, body)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get()
  getTasks() {
    return this.http
      .get(`${this.tasksServiceUrl}/tasks`)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get(':id')
  getTask(@Param('id') id: string) {
    return this.http
      .get(`${this.tasksServiceUrl}/tasks/${id}`)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string) {
    return this.http
      .delete(`${this.tasksServiceUrl}/tasks/${id}`)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Patch(':id/status')
  updateTaskStatus(@Param('id') id: string, @Body() body: unknown) {
    return this.http
      .patch(`${this.tasksServiceUrl}/tasks/${id}/status`, body)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
