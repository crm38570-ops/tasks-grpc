import { catchError, firstValueFrom, map, throwError } from 'rxjs';
import {
  DeleteFileResponse,
  ListFilesResponse,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { FilesClientService } from './files-client.service';
import { eachValueFrom } from 'rxjs-for-await';
import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { Readable } from 'node:stream';
import { User } from '../auth/user.entity';
import { UploadFileDto } from './dto/upload-file.dto';
import { ListFilesReqDto } from './dto/list-files.req.dto';
import { TasksService } from '../tasks/tasks.service';
import { DownloadFileReqDto } from './dto/download-file.req.dto';
import { DeleteFileReqDto } from './dto/delete-file.req.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly filesClientService: FilesClientService,
    private readonly tasksService: TasksService,
  ) {}

  private handleFileError(error: unknown): never {
    const grpcError = error as { code?: number };

    if (grpcError.code === 5) {
      throw new NotFoundException('Файл не найден');
    }

    throw error;
  }

  async uploadFile(
    uploadFileDto: UploadFileDto,
    user: User,
  ): Promise<UploadFileResponse> {
    const { taskId } = uploadFileDto.metadata;

    await this.validateUserTask(taskId, user);

    const uploadFileRequest = {
      ...uploadFileDto,
      metadata: { ...uploadFileDto.metadata, userId: user.id },
    };

    return firstValueFrom(
      this.filesClientService.uploadFile(uploadFileRequest),
    );
  }

  async listFiles(
    { taskId }: ListFilesReqDto,
    user: User,
  ): Promise<ListFilesResponse> {
    try {
      return await firstValueFrom(
        this.filesClientService.listFiles({ taskId, userId: user.id }),
      );
    } catch (err) {
      this.handleFileError(err);
    }
  }

  async downloadFile(
    downloadFileDto: DownloadFileReqDto,
    user: User,
  ): Promise<StreamableFile> {
    const { fileId, taskId } = downloadFileDto;

    await this.validateUserTask(taskId, user);

    const filesResponse = await this.listFiles({ taskId }, user);

    const hasAccess = filesResponse.files.some(
      (file) => file.fileId === fileId,
    );

    if (!hasAccess) {
      throw new NotFoundException('Файл не найден');
    }

    const fileReadableStream = Readable.from(
      eachValueFrom(
        this.filesClientService.downloadFile({ fileId, userId: user.id }).pipe(
          map(({ chunk }) => chunk),
          catchError((error: unknown) => {
            const grpcError = error as { code?: number };

            if (grpcError.code === 5) {
              return throwError(() => new NotFoundException('Файл не найден'));
            }

            return throwError(() => error);
          }),
        ),
      ),
    );

    return new StreamableFile(fileReadableStream);
  }

  async deleteFile(
    deleteFileDto: DeleteFileReqDto,
    user: User,
  ): Promise<DeleteFileResponse> {
    const { taskId, fileId } = deleteFileDto;

    await this.validateUserTask(taskId, user);

    try {
      return await firstValueFrom(
        this.filesClientService.deleteFile({ fileId, userId: user.id }),
      );
    } catch (err) {
      this.handleFileError(err);
    }
  }

  async validateUserTask(taskId: string, user: User) {
    const found = await this.tasksService.getTaskById(taskId, user);

    if (!found)
      throw new NotFoundException(
        `У пользователя ${user.username} нет задачи с ID: ${taskId}`,
      );
  }
}
