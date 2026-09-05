import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesRepository } from './files.repository';
import { RpcException } from '@nestjs/microservices';
import fs, { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  ListFilesRequest,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { join } from 'node:path';
import { catchError, concat, defer, from, map, of } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { FileEntity } from './file.entity';
import { validateUploadFileContent } from './services/validate.upload-file.content';
import { validateFileName } from './services/validate.file-name';
import { validateFileUser } from './services/validate.file-user';
import { UploadFileRequestDto } from '../dto/upload-file.request.dto';
import { validateUploadFileRequest } from './services/validate.upload-file.request';
import { toGrpcError } from '../common/filters/to-grpc-error';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { TaskOwnershipService } from './tasks-internal/task-ownership.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger('FilesService', { timestamp: true });

  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly taskOwnershipService: TaskOwnershipService,
    private readonly configService: ConfigService,
  ) {}

  private get fileDir(): string {
    return this.configService.getOrThrow<string>('FILE_DIR');
  }

  private get maxUploadSize(): number {
    return this.configService.getOrThrow<number>('MAX_UPLOAD_SIZE');
  }

  async onModuleInit() {
    try {
      await fs.promises.mkdir(this.fileDir, { recursive: true });
    } catch (err) {
      const stack = err instanceof Error ? err.stack : String(err);
      this.logger.error(
        `Не удалось создать директорию ${this.fileDir}: ${stack}`,
      );
      throw err;
    }
  }

  saveFile(
    request: Readable,
    callback: (err: unknown, res?: UploadFileResponse) => void,
  ): void {
    this.handleUpload(request).then(
      (res) => callback(null, res),
      (err: unknown) => callback(toGrpcError(err)),
    );
  }

  private async handleUpload(
    request: Readable,
  ): Promise<UploadFileResponse> {
    const fileId = randomUUID();
    const filePath = join(this.fileDir, fileId);
    const writeStream = createWriteStream(filePath);

    let totalBytes = 0;
    let firstMessage: UploadFileRequestDto | undefined;

    try {
      for await (const raw of request) {
        const message = raw as UploadFileRequestDto;
        if (!firstMessage) {
          validateUploadFileRequest(message);
          validateFileName(message.metadata.fileName, this.logger);
          firstMessage = message;

          await this.taskOwnershipService.validateTaskOwner(
            message.metadata.taskId,
            message.metadata.userId,
          );
        }

        totalBytes += message.content.length;

        if (message.content.length) {
          validateUploadFileContent(totalBytes, this.maxUploadSize);
        }

        if (!writeStream.write(message.content)) {
          await once(writeStream, 'drain');
        }
      }

      if (!firstMessage) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Пустой поток',
        });
      }

      validateUploadFileContent(totalBytes, this.maxUploadSize);

      await new Promise<void>((res, rej) =>
        writeStream.end((err?: Error | null) => (err ? rej(err) : res())),
      );

      const { metadata } = firstMessage;

      await this.filesRepository.saveFile({
        fileId,
        ...metadata,
        size: totalBytes,
      });

      this.logger.log(`Файл с id ${fileId} успешно сохранён.`);

      return { fileId };
    } catch (err) {
      const metadata = firstMessage?.metadata;
      const stack = err instanceof Error ? err.stack : String(err);
      this.logger.error(
        `Не удалось сохранить файл: fileId=${fileId}, taskId=${metadata?.taskId ?? 'unknown'}, userId=${metadata?.userId ?? 'unknown'}, StackTrace: ${stack}`,
      );
      if (!writeStream.destroyed) {
        writeStream.destroy();
        await once(writeStream, 'close');
      }
      await fs.promises.unlink(filePath).catch(() => undefined);
      throw err;
    }
  }

  private logFailure(message: string, err: unknown): void {
    const stack = err instanceof Error ? err.stack : String(err);
    const text = `${message} StackTrace: ${stack}`;

    if (err instanceof RpcException) {
      this.logger.warn(text);
    } else {
      this.logger.error(text);
    }
  }

  async getListFiles(listFilesRequest: ListFilesRequest) {
    const { taskId } = listFilesRequest;

    try {
      const files = await this.filesRepository.getListFiles(listFilesRequest);

      return { files };
    } catch (err) {
      this.logFailure(
        `Не удалось получить список файлов для taskId: ${taskId}`,
        err,
      );

      throw err;
    }
  }

  async deleteFile(deleteFileRequest: DeleteFileRequest) {
    const { fileId, userId, taskId } = deleteFileRequest;

    try {
      const file = await this.filesRepository.getFile(fileId);

      const ownedFile = validateFileUser({ file, userId });

      await this.taskOwnershipService.validateTaskOwner(taskId, userId);

      if (ownedFile.taskId !== taskId) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Файл не найден',
        });
      }

      const result = await this.filesRepository.deleteFile(deleteFileRequest);

      if (!result.affected) {
        const message = `Файл с ID: ${fileId} не найден`;

        this.logger.warn(message);

        throw new RpcException({ code: status.NOT_FOUND, message });
      }

      await fs.promises.unlink(join(this.fileDir, fileId)).catch((err) => {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
          this.logger.error(
            `Запись удалена из БД, но файл не удалён с диска: fileId=${fileId}. StackTrace: ${err instanceof Error ? err.stack : String(err)}`,
          );
        }
      });

      this.logger.log(`Файл с id ${fileId} успешно удалён.`);
    } catch (err) {
      this.logFailure(`Не удалось удалить файл с fileId: ${fileId}`, err);

      throw err;
    }
  }

  async downloadFile(downloadFileRequest: DownloadFileRequest) {
    const { userId, fileId } = downloadFileRequest;

    this.logger.log(`Download started: userId=${userId}, fileId=${fileId}`);

    let file: FileEntity | null;

    try {
      file =
        await this.filesRepository.downloadFileVerifyUser(downloadFileRequest);
    } catch (err) {
      const stack = err instanceof Error ? err.stack : String(err);
      this.logger.error(`Ошибка при проверке доступа к файлу: ${stack}`);
      throw err;
    }

    if (!file) {
      this.logger.error(`Ошибка при проверке доступа к файлу`);

      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Файл не найден',
      });
    }

    return defer(() => {
      this.logger.log(`Download stream opened: fileId=${fileId}`);

      const metadata = {
        fileId: file.fileId,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: Number(file.size),
        taskId: file.taskId,
        uploadedAt: file.uploadedAt.toISOString(),
      };

      return concat(
        of({
          chunk: new Uint8Array(),
          metadata,
        }),
        from(fs.createReadStream(join(this.fileDir, fileId))).pipe(
          map((chunk: Buffer) => ({ chunk, metadata: undefined })),
          catchError((err) => {
            const stack = err instanceof Error ? err.stack : String(err);
            this.logger.error(`Ошибка чтения файла ${fileId}: ${stack}`);
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
              throw new RpcException({
                code: status.NOT_FOUND,
                message: 'Файл не найден',
              });
            }

            throw err;
          }),
        ),
      );
    });
  }
}
