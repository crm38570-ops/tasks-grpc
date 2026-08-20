import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
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
import { AuthGuard } from '@nestjs/passport';
import { User } from '../auth/user.entity';
import { GetUser } from '../auth/get-user.decorator';
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
import type { Express } from 'express';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(AuthGuard())
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
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
    @GetUser() user: User,
  ): Promise<UploadFileResponse> {
    if (!file) {
      throw new BadRequestException('Файл обязателен');
    }

    const { buffer, originalname, mimetype, size } = file;
    const { taskId } = uploadFileDto;

    return this.filesService.uploadFile(
      {
        content: buffer,
        metadata: {
          fileName: originalname,
          mimeType: mimetype,
          size: size,
          taskId,
        },
      },
      user,
    );
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
    @GetUser() user: User,
  ): Promise<ListFilesResponse> {
    return this.filesService.listFiles(listFilesRequest, user);
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
    @GetUser() user: User,
  ): Promise<StreamableFile> {
    const downloadFileReqDto: DownloadFileReqDto = { fileId, taskId };

    return this.filesService.downloadFile(downloadFileReqDto, user);
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
    @GetUser() user: User,
  ): Promise<DeleteFileResponse> {
    const deleteFileReqDto: DeleteFileReqDto = { fileId, taskId };

    return this.filesService.deleteFile(deleteFileReqDto, user);
  }
}
