import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import type {
  DeleteFileResponse,
  ListFilesResponse,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { DownloadFileReqDto } from './dto/download-file.req.dto';
import { DeleteFileReqDto } from './dto/delete-file.req.dto';
import { ListFilesReqDto } from './dto/list-files.req.dto';
import { GetUserId } from '../decorators/get-user-id.decorator';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileIdParamDto } from './dto/file-id.param.dto';
import { TaskIdQueryDto } from './dto/task-id.query.dto';
import { ListFilesResponseDto } from './dto/list-files.response.dto';
import { UploadFileResponseDto } from './dto/upload-file.response.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { BadRequestException } from '@nestjs/common';
import type { Express, Request } from 'express';
import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiOperation({
    summary: 'Загрузка файла',
    description:
      'Временный JSON-формат загрузки. Multipart-загрузка будет добавлена позже.',
  })
  @ApiResponse({
    status: 201,
    description: 'Файл успешно загружен',
    type: UploadFileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные файла или задачи',
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Задача не найдена или недоступна' })
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: tmpdir(),
        filename: (_req, _file, callback) => callback(null, randomUUID()),
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
    @GetUserId() userId: string,
  ): Promise<UploadFileResponse> {
    if (!file) {
      throw new BadRequestException('Файл обязателен');
    }

    const { path, originalname, mimetype, size } = file;
    const { taskId } = uploadFileDto;

    try {
      return await this.filesService.uploadFile(
        {
          content: createReadStream(path),
          metadata: {
            fileName: originalname,
            mimeType: mimetype,
            size,
            taskId,
          },
        },
        userId,
      );
    } finally {
      await unlink(path).catch(() => undefined);
    }
  }

  @ApiOperation({ summary: 'Получение списка файлов задачи' })
  @ApiQuery({
    name: 'taskId',
    type: String,
    format: 'uuid',
    description: 'Идентификатор задачи в формате UUID v4',
  })
  @ApiResponse({
    status: 200,
    description: 'Список файлов задачи',
    type: ListFilesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @Get()
  async listFiles(
    @Query() listFilesRequest: ListFilesReqDto,
    @GetUserId() userId: string,
  ): Promise<ListFilesResponse> {
    return this.filesService.listFiles(listFilesRequest, userId);
  }

  @ApiOperation({ summary: 'Скачивание файла' })
  @ApiProduces('application/octet-stream')
  @ApiParam({
    name: 'fileId',
    type: String,
    format: 'uuid',
    description: 'Идентификатор файла в формате UUID v4',
  })
  @ApiQuery({
    name: 'taskId',
    type: String,
    format: 'uuid',
    description: 'Идентификатор задачи в формате UUID v4',
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
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Файл или задача не найдены' })
  @Get(':fileId')
  downloadFile(
    @Param() { fileId }: FileIdParamDto,
    @Query() { taskId }: TaskIdQueryDto,
    @GetUserId() userId: string,
    @Req() req: Request,
  ): Promise<StreamableFile> {
    const downloadFileReqDto: DownloadFileReqDto = { fileId, taskId };

    return this.filesService.downloadFile(downloadFileReqDto, userId, req);
  }

  @ApiOperation({ summary: 'Удаление файла' })
  @ApiParam({
    name: 'fileId',
    type: String,
    format: 'uuid',
    description: 'Идентификатор файла в формате UUID v4',
  })
  @ApiQuery({
    name: 'taskId',
    type: String,
    format: 'uuid',
    description: 'Идентификатор задачи в формате UUID v4',
  })
  @ApiResponse({ status: 200, description: 'Файл успешно удалён' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({ status: 404, description: 'Файл или задача не найдены' })
  @Delete(':fileId')
  async deleteFile(
    @Param() { fileId }: FileIdParamDto,
    @Query() { taskId }: TaskIdQueryDto,
    @GetUserId() userId: string,
  ): Promise<DeleteFileResponse> {
    const deleteFileReqDto: DeleteFileReqDto = { fileId, taskId };

    return this.filesService.deleteFile(deleteFileReqDto, userId);
  }
}
