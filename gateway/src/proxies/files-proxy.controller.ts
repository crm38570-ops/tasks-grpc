import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';

const TASKS_SERVICE_URL =
  process.env.TASKS_SERVICE_URL ?? 'http://localhost:3000';

// files-service — gRPC, наружу его не отдаём:
// проксируем HTTP-эндпоинты tasks-service, который уже оборачивает gRPC
@Controller('files')
export class FilesProxyController {
  constructor(private readonly http: HttpService) {}

  @Post('upload')
  uploadFile() {
    // TODO: multipart/form-data форвард (FormData/stream)
  }

  @Get()
  getListFiles() {
    return this.http
      .get(`${TASKS_SERVICE_URL}/files`)
      .pipe(map((response) => response.data));
  }

  @Get(':fileId')
  downloadFile(@Param('fileId') fileId: string) {
    // TODO: стрим ответа вниз по течению (responseType: 'stream')
    return this.http
      .get(`${TASKS_SERVICE_URL}/files/${fileId}`)
      .pipe(map((response) => response.data));
  }

  @Delete(':fileId')
  deleteFile(@Param('fileId') fileId: string) {
    return this.http
      .delete(`${TASKS_SERVICE_URL}/files/${fileId}`)
      .pipe(map((response) => response.data));
  }
}
