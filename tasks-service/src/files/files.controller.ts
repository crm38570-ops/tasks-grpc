import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
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
import { FileIdParamDto } from './dto/file-id.param.dto';
import { TaskIdQueryDto } from './dto/task-id.query.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { BadRequestException } from '@nestjs/common';
import type { Express, Request } from 'express';
import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';

@Controller('files')
export class FilesController {
  private readonly logger = new Logger('FilesController', { timestamp: true });

  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
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

    this.logger.verbose(
      `User "${userId}" uploading file for task "${taskId}". File: name=${originalname}, mimeType=${mimetype}, size=${size}`,
    );

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

  @Get()
  async listFiles(
    @Query() listFilesRequest: ListFilesReqDto,
    @GetUserId() userId: string,
  ): Promise<ListFilesResponse> {
    this.logger.verbose(
      `User "${userId}" retrieving files for task "${listFilesRequest.taskId}"`,
    );
    return this.filesService.listFiles(listFilesRequest, userId);
  }

  @Get(':fileId')
  downloadFile(
    @Param() { fileId }: FileIdParamDto,
    @Query() { taskId }: TaskIdQueryDto,
    @GetUserId() userId: string,
    @Req() req: Request,
  ): Promise<StreamableFile> {
    const downloadFileReqDto: DownloadFileReqDto = { fileId, taskId };

    this.logger.verbose(
      `User "${userId}" downloading file "${fileId}" from task "${taskId}"`,
    );
    return this.filesService.downloadFile(downloadFileReqDto, userId, req);
  }

  @Delete(':fileId')
  async deleteFile(
    @Param() { fileId }: FileIdParamDto,
    @Query() { taskId }: TaskIdQueryDto,
    @GetUserId() userId: string,
  ): Promise<DeleteFileResponse> {
    const deleteFileReqDto: DeleteFileReqDto = { fileId, taskId };

    this.logger.verbose(
      `User "${userId}" deleting file "${fileId}" from task "${taskId}"`,
    );
    return this.filesService.deleteFile(deleteFileReqDto, userId);
  }
}
