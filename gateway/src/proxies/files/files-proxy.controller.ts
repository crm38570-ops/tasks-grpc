import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthedRequest } from '../../auth/jwt-auth.guard';
import { FilesProxyService } from './files-proxy.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesProxyController {
  constructor(private readonly filesProxyService: FilesProxyService) {}

  @ApiOperation({ summary: 'Загрузка файла' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'taskId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Загружаемый файл',
        },
        taskId: {
          type: 'string',
          format: 'uuid',
          description: 'UUID задачи',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Файл загружен' })
  @ApiResponse({ status: 400, description: 'Некорректные данные файла' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @Post('upload')
  uploadFile(@Req() request: AuthedRequest) {
    return this.filesProxyService.uploadFile(request);
  }

  @ApiOperation({ summary: 'Получение списка файлов задачи' })
  @ApiResponse({ status: 200, description: 'Список файлов задачи' })
  @ApiResponse({ status: 400, description: 'Некорректный taskId' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiQuery({ name: 'taskId', required: true, format: 'uuid' })
  @Get()
  getListFiles(@Query('taskId') taskId: string, @Req() request: AuthedRequest) {
    return this.filesProxyService.getListFiles(taskId, request);
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
  @ApiQuery({ name: 'taskId', required: true, format: 'uuid' })
  @Get(':fileId')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Query('taskId') taskId: string,
    @Req() request: AuthedRequest,
  ): Promise<StreamableFile> {
    return this.filesProxyService.downloadFile(fileId, taskId, request);
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
  @ApiQuery({ name: 'taskId', required: true, format: 'uuid' })
  @Delete(':fileId')
  deleteFile(
    @Param('fileId') fileId: string,
    @Query('taskId') taskId: string,
    @Req() request: AuthedRequest,
  ) {
    return this.filesProxyService.deleteFile(fileId, taskId, request);
  }
}
