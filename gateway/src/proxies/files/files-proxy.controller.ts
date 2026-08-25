import {
  Controller,
  Delete,
  Get,
  Param,
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

// files-service — gRPC, наружу его не отдаём:
// проксируем HTTP-эндпоинты tasks-service, который оборачивает gRPC.
// ВНИМАНИЕ: files-модуль удалён из tasks-service — решить, кто проксирует файлы (см. TASKS.md).
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesProxyController {
  private readonly tasksServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.tasksServiceUrl = config.getOrThrow('TASKS_SERVICE_URL');
  }

  @Post('upload')
  uploadFile(@Req() _request: AuthedRequest) {
    // TODO: multipart/form-data форвард (FormData/stream)
  }

  @Get()
  getListFiles(@Req() request: AuthedRequest) {
    return this.http
      .get(`${this.tasksServiceUrl}/files`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get(':fileId')
  downloadFile(@Param('fileId') fileId: string, @Req() request: AuthedRequest) {
    // TODO: стрим ответа вниз по течению (responseType: 'stream')
    return this.http
      .get(`${this.tasksServiceUrl}/files/${fileId}`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Delete(':fileId')
  deleteFile(@Param('fileId') fileId: string, @Req() request: AuthedRequest) {
    return this.http
      .delete(`${this.tasksServiceUrl}/files/${fileId}`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
