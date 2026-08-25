import { Injectable, Logger } from '@nestjs/common';
import { FilesRepository } from './files.repository';
import { RpcException } from '@nestjs/microservices';
import fs, { createWriteStream } from 'node:fs';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  ListFilesRequest,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { join } from 'node:path';
import { catchError, concat, defer, from, map, Observable, of } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { FileEntity } from './file.entity';
import { validateUploadFileContent } from './services/validate.upload-file.content';
import { validateFileId } from './services/validate.file-id';
import { validateFileUser } from './services/validate.file-user';
import { UploadFileRequestDto } from '../dto/upload-file.request.dto';
import { validateUploadFileRequest } from './services/validate.upload-file.request';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { eachValueFrom } from 'rxjs-for-await';

@Injectable()
export class FilesService {
  private logger = new Logger('FilesService', { timestamp: true });
  private FILE_DIR: string;

  constructor(private readonly filesRepository: FilesRepository) {
    this.FILE_DIR = process.env.FILE_DIR!;
  }

  async onModuleInit() {
    try {
      await fs.promises.mkdir(this.FILE_DIR, { recursive: true });
    } catch (err) {
      this.logger.error(
        `Не удалось создать директорию ${this.FILE_DIR}: ${(err as Error).stack}`,
      );
      throw err;
    }
  }

  async saveFile(
    uploadFileRequest$: Observable<UploadFileRequestDto>,
  ): Promise<UploadFileResponse> {
    const fileId = randomUUID();
    const filePath = join(this.FILE_DIR, fileId);
    const writeStream = createWriteStream(filePath);

    let totalBytes = 0;

    try {
      let firstMessage: UploadFileRequestDto | undefined;

      for await (const message of eachValueFrom(uploadFileRequest$)) {
        if (!firstMessage) {
          validateUploadFileRequest(message);
          firstMessage = message;
        }

        totalBytes += message.content.length;

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

      validateUploadFileContent(totalBytes, firstMessage.metadata.size);

      await new Promise<void>((res, rej) =>
        writeStream.end((err?: Error | null) => (err ? rej(err) : res())),
      );

      const { metadata } = firstMessage;

      await this.filesRepository.saveFile({ fileId, ...metadata });

      this.logger.log(`Файл с id ${fileId} успешно сохранён.`);

      return { fileId };
    } catch (err) {
      writeStream.destroy();
      await fs.promises.unlink(filePath).catch(() => undefined);
      throw err;
    }
  }

  async getListFiles(listFilesRequest: ListFilesRequest) {
    const { taskId } = listFilesRequest;

    try {
      const files = await this.filesRepository.getListFiles(listFilesRequest);

      if (!files.length) {
        const message = 'Для данной задачи нет подходящих файлов';

        this.logger.error(`${message}: taskId=${taskId}`);

        throw new RpcException({
          code: status.NOT_FOUND,
          message,
        });
      }

      return { files };
    } catch (err) {
      this.logger.error(
        `Не удалось получить список файлов для taskId: ${taskId}. StackTrace: ${(err as RpcException).stack}`,
      );

      throw err;
    }
  }

  async deleteFile(deleteFileRequest: DeleteFileRequest) {
    const { fileId, userId } = deleteFileRequest;

    try {
      validateFileId(fileId, this.logger);

      const file = await this.filesRepository.getFile(fileId);

      validateFileUser({ file, userId });

      await fs.promises.unlink(join(this.FILE_DIR, fileId)).catch((err) => {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      });

      const result = await this.filesRepository.deleteFile(deleteFileRequest);

      if (!result.affected) {
        const message = `Файл с ID: ${fileId} не найден`;

        this.logger.warn(message);

        throw new RpcException({ code: status.NOT_FOUND, message });
      }

      this.logger.log(`Файл с id ${fileId} успешно удалён.`);
    } catch (err) {
      this.logger.error(
        `Не удалось удалить файл с fileId: ${fileId}. StackTrace: ${(err as RpcException).stack}`,
      );

      throw err;
    }
  }

  async downloadFile(downloadFileRequest: DownloadFileRequest) {
    const { userId, fileId } = downloadFileRequest;

    this.logger.log(`Download started: userId=${userId}, fileId=${fileId}`);

    let file: FileEntity | null;

    try {
      validateFileId(fileId, this.logger);
      file =
        await this.filesRepository.downloadFileVerifyUser(downloadFileRequest);
    } catch (err) {
      this.logger.error(
        `Ошибка при проверке доступа к файлу: ${(err as Error).stack}`,
      );
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

      const { userId, ...fileMetadata } = file;
      void userId;

      return concat(
        of({
          chunk: new Uint8Array(),
          metadata: {
            ...fileMetadata,
          },
        }),
        from(fs.createReadStream(join(this.FILE_DIR, fileId))).pipe(
          map((chunk: Buffer) => ({ chunk, metadata: undefined })),
          catchError((err) => {
            this.logger.error(
              `Ошибка чтения файла ${fileId}: ${(err as Error).stack}`,
            );
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
