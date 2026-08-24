import { Injectable, Logger } from '@nestjs/common';
import { FilesRepository } from './files.repository';
import { RpcException } from '@nestjs/microservices';
import fs from 'node:fs';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  FileMetadataRequest,
  ListFilesRequest,
} from '../proto/files/generated/files_service';
import { join } from 'node:path';
import {
  catchError,
  defer,
  from,
  lastValueFrom,
  map,
  Observable,
  toArray,
} from 'rxjs';
import { status } from '@grpc/grpc-js';
import { FileEntity } from './file.entity';
import { validateUploadFileContent } from './services/validate.upload-file.content';
import { randomUUID } from 'node:crypto';
import { validateFileId } from './services/validate.file-id';
import { validateFileUser } from './services/validate.file-user';
import { UploadFileRequestDto } from './dto/upload-file.request.dto';
import { validateUploadFileRequest } from './services/validate.upload-file.request';

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

  async saveFile(uploadFileRequest$: Observable<UploadFileRequestDto>) {
    let fileId: string;

    const chunks = await lastValueFrom(uploadFileRequest$.pipe(toArray()));

    if (!chunks.length) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Пустой поток',
      });
    }

    const [first] = chunks;

    validateUploadFileRequest(first);

    const content = Buffer.concat(chunks.map((chunk) => chunk.content));

    validateUploadFileContent(content);

    const { metadata } = first;

    const normalizedMetadata = {
      ...metadata,
      fileName: randomUUID(),
      size: metadata.size,
    } as FileMetadataRequest;

    try {
      fileId = (await this.filesRepository.saveFile(normalizedMetadata)).fileId;

      await fs.promises.writeFile(
        join(this.FILE_DIR, fileId),
        Buffer.from(content),
      );

      this.logger.log(`Файл с id ${fileId} успешно сохранён.`);

      return { fileId };
    } catch (err) {
      this.logger.error(
        `Не удалось сохранить файл: ${(err as RpcException).stack}`,
      );

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

      const result = await this.filesRepository.deleteFile(deleteFileRequest);

      if (!result.affected) {
        const message = `Файл с ID: ${fileId} не найден`;

        this.logger.warn(message);

        throw new RpcException({ code: status.NOT_FOUND, message });
      }

      await fs.promises.unlink(join(this.FILE_DIR, fileId));

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

      return from(fs.createReadStream(join(this.FILE_DIR, fileId))).pipe(
        map((chunk: Buffer) => ({ chunk })),
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
      );
    });
  }
}
