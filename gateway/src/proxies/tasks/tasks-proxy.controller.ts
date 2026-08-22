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
import { map } from 'rxjs';
import { AxiosResponse } from 'axios';

const TASKS_SERVICE_URL =
  process.env.TASKS_SERVICE_URL ?? 'http://localhost:3000';

@Controller('tasks')
export class TasksProxyController {
  constructor(private readonly http: HttpService) {}

  @Post()
  createTask(@Body() body: unknown) {
    return this.http
      .post(`${TASKS_SERVICE_URL}/tasks`, body)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get()
  getTasks() {
    return this.http
      .get(`${TASKS_SERVICE_URL}/tasks`)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get(':id')
  getTask(@Param('id') id: string) {
    return this.http
      .get(`${TASKS_SERVICE_URL}/tasks/${id}`)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string) {
    return this.http
      .delete(`${TASKS_SERVICE_URL}/tasks/${id}`)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Patch(':id/status')
  updateTaskStatus(@Param('id') id: string, @Body() body: unknown) {
    return this.http
      .patch(`${TASKS_SERVICE_URL}/tasks/${id}/status`, body)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
