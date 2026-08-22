import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs';
import { AxiosResponse } from 'axios';

// files-service — gRPC, наружу его не отдаём:
// проксируем HTTP-эндпоинты tasks-service, который уже оборачивает gRPC
@Controller('files')
export class FilesProxyController {
  private readonly tasksServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.tasksServiceUrl = config.getOrThrow('TASKS_SERVICE_URL');
  }

  @Post('upload')
  uploadFile() {
    // TODO: multipart/form-data форвард (FormData/stream)
  }

  @Get()
  getListFiles() {
    return this.http
      .get(`${this.tasksServiceUrl}/files`)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get(':fileId')
  downloadFile(@Param('fileId') fileId: string) {
    // TODO: стрим ответа вниз по течению (responseType: 'stream')
    return this.http
      .get(`${this.tasksServiceUrl}/files/${fileId}`)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Delete(':fileId')
  deleteFile(@Param('fileId') fileId: string) {
    return this.http
      .delete(`${this.tasksServiceUrl}/files/${fileId}`)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
