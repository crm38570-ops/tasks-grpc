import { catchError, firstValueFrom, map, Observable, throwError } from 'rxjs';
import {
  DeleteFileResponse,
  ListFilesResponse,
  UploadFileRequest,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { FilesClientService } from './files-client.service';
import { eachValueFrom } from 'rxjs-for-await';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import { ListFilesReqDto } from './dto/list-files.req.dto';
import { TasksService } from '../tasks/tasks.service';
import { DownloadFileReqDto } from './dto/download-file.req.dto';
import { DeleteFileReqDto } from './dto/delete-file.req.dto';
import { UploadFileInputInterface } from './interfaces';
import { handleFileError } from './services/handle.file.error';

@Injectable()
export class FilesService {
  private readonly logger = new Logger('FilesService');

  constructor(
    private readonly filesClientService: FilesClientService,
    private readonly tasksService: TasksService,
  ) {}

  async uploadFile(
    uploadFileInput: UploadFileInputInterface,
    userId: string,
  ): Promise<UploadFileResponse> {
    const { metadata, content } = uploadFileInput;

    if (!metadata) {
      throw new BadRequestException('Метаданные файла обязательны');
    }

    const { taskId } = metadata;

    this.logger.log(`Upload started: userId=${userId}, taskId=${taskId}`);

    await this.validateUserTask(taskId, userId);

    const grpcRequest$ = new Observable<UploadFileRequest>((subscriber) => {
      subscriber.next({
        content: new Uint8Array(0),
        metadata: { ...metadata, userId },
      });

      content.on('data', (chunk: Buffer) =>
        subscriber.next({ content: chunk, metadata: undefined }),
      );
      content.on('end', () => subscriber.complete());
      content.on('error', (error: Error) => subscriber.error(error));
    });

    try {
      const response = await firstValueFrom(
        this.filesClientService.uploadFile(grpcRequest$),
      );

      this.logger.log(
        `Upload completed: userId=${userId}, taskId=${taskId}, fileId=${response.fileId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Upload failed: userId=${userId}, taskId=${taskId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async listFiles(
    { taskId }: ListFilesReqDto,
    userId: string,
  ): Promise<ListFilesResponse> {
    this.logger.log(`List started: userId=${userId}, taskId=${taskId}`);

    try {
      const response = await firstValueFrom(
        this.filesClientService.listFiles({ taskId, userId }),
      );

      this.logger.log(
        `List completed: userId=${userId}, taskId=${taskId}, count=${response.files.length}`,
      );
      return response;
    } catch (err) {
      this.logger.error(
        `List failed: userId=${userId}, taskId=${taskId}`,
        err instanceof Error ? err.stack : String(err),
      );
      return handleFileError(err);
    }
  }

  async downloadFile(
    downloadFileDto: DownloadFileReqDto,
    userId: string,
  ): Promise<StreamableFile> {
    const { fileId, taskId } = downloadFileDto;

    this.logger.log(
      `Download started: userId=${userId}, taskId=${taskId}, fileId=${fileId}`,
    );

    await this.validateUserTask(taskId, userId);

    const filesResponse = await this.listFiles({ taskId }, userId);

    const hasAccess = filesResponse.files.some(
      (file) => file.fileId === fileId,
    );

    if (!hasAccess) {
      throw new NotFoundException('Файл не найден');
    }

    const fileReadableStream = Readable.from(
      eachValueFrom(
        this.filesClientService.downloadFile({ fileId, userId }).pipe(
          map(({ chunk }) => chunk),
          catchError((error: unknown) => {
            this.logger.error(
              `Download failed: userId=${userId}, taskId=${taskId}, fileId=${fileId}`,
              error instanceof Error ? error.stack : String(error),
            );
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
    userId: string,
  ): Promise<DeleteFileResponse> {
    const { taskId, fileId } = deleteFileDto;

    this.logger.log(
      `Delete started: userId=${userId}, taskId=${taskId}, fileId=${fileId}`,
    );

    await this.validateUserTask(taskId, userId);

    try {
      const response = await firstValueFrom(
        this.filesClientService.deleteFile({ fileId, userId }),
      );

      this.logger.log(
        `Delete completed: userId=${userId}, taskId=${taskId}, fileId=${fileId}`,
      );
      return response;
    } catch (err) {
      this.logger.error(
        `Delete failed: userId=${userId}, taskId=${taskId}, fileId=${fileId}`,
        err instanceof Error ? err.stack : String(err),
      );
      return handleFileError(err);
    }
  }

  async validateUserTask(taskId: string, userId: string) {
    const found = await this.tasksService.getTaskById(taskId, userId);

    if (!found)
      throw new NotFoundException(
        `У пользователя ${userId} нет задачи с ID: ${taskId}`,
      );
  }
}
