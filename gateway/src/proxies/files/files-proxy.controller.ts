import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  StreamableFile,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map } from 'rxjs';
import { AxiosResponse } from 'axios';
import type { Readable } from 'node:stream';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthedRequest } from '../../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesProxyController {
  private readonly logger = new Logger('FilesProxyController', {
    timestamp: true,
  });
  private readonly tasksServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.tasksServiceUrl = config.getOrThrow('TASKS_SERVICE_URL');
  }

  @ApiOperation({ summary: 'Загрузка файла' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Файл загружен' })
  @ApiResponse({ status: 400, description: 'Некорректные данные файла' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @Post('upload')
  uploadFile(@Req() request: AuthedRequest) {
    this.logger.verbose(`Upload file request: userId=${request.user.userId}`);
    return this.http
      .post(`${this.tasksServiceUrl}/files/upload`, request, {
        headers: {
          'X-User-Id': request.user.userId,
          'content-type': request.headers['content-type'],
          'content-length': request.headers['content-length'],
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @ApiOperation({ summary: 'Получение списка файлов задачи' })
  @ApiResponse({ status: 200, description: 'Список файлов задачи' })
  @ApiResponse({ status: 400, description: 'Некорректный taskId' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @Get()
  getListFiles(@Req() request: AuthedRequest) {
    this.logger.verbose(`List files request: userId=${request.user.userId}`);
    return this.http
      .get(`${this.tasksServiceUrl}/files`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @ApiOperation({ summary: 'Скачивание файла' })
  @ApiProduces('application/octet-stream')
  @ApiParam({
    name: 'fileId',
    type: String,
    format: 'uuid',
    description: 'UUID файла',
  })
  @ApiResponse({
    status: 200,
    description: 'Бинарное содержимое файла',
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Некорректный fileId' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  @Get(':fileId')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Req() request: AuthedRequest,
  ): Promise<StreamableFile> {
    this.logger.verbose(
      `Download file request: fileId=${fileId}, userId=${request.user.userId}`,
    );
    const response = await firstValueFrom(
      this.http.get(`${this.tasksServiceUrl}/files/${fileId}`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
        responseType: 'stream',
      }),
    );

    return new StreamableFile(response.data as Readable, {
      type: response.headers['content-type'] as string | undefined,
      disposition: response.headers['content-disposition'] as
        string | undefined,
    });
  }

  @ApiOperation({ summary: 'Удаление файла' })
  @ApiParam({
    name: 'fileId',
    type: String,
    format: 'uuid',
    description: 'UUID файла',
  })
  @ApiResponse({ status: 200, description: 'Файл удалён' })
  @ApiResponse({ status: 400, description: 'Некорректный fileId' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  @Delete(':fileId')
  deleteFile(@Param('fileId') fileId: string, @Req() request: AuthedRequest) {
    this.logger.verbose(
      `Delete file request: fileId=${fileId}, userId=${request.user.userId}`,
    );
    return this.http
      .delete(`${this.tasksServiceUrl}/files/${fileId}`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
