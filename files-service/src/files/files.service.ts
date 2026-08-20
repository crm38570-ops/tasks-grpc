import {
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FilesRepository } from './files.repository';
import { RpcException } from '@nestjs/microservices';
import fs from 'node:fs';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  ListFilesRequest,
  UploadFileRequest,
} from '../proto/files/generated/files_service';
import { join } from 'node:path';
import { UploadFileReqValidator } from './services/upload-file.req.validator';
import { catchError, defer, from, map } from 'rxjs';

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
      const message = `При создании директории произошла непредвиденная ошибка: ${err}`;

      this.logger.error(message);
      throw new InternalServerErrorException(message);
    }
  }

  private fileIdValidator(fileId: string) {
    if (fileId.includes('..')) {
      const message = 'Некорректный fileId';
      this.logger.warn(message);
      throw new RpcException({ code: 3, message: message });
    }
  }

  async saveFile(uploadFileRequest: UploadFileRequest) {
    const { metadata, content } = uploadFileRequest;
    this.logger.log(
      `Upload started: userId=${metadata?.userId}, taskId=${metadata?.taskId}, size=${content?.length ?? 0}`,
    );
    const isValid = UploadFileReqValidator(uploadFileRequest);

    if (isValid?.errors) throw isValid.errors;

    if (!metadata) {
      const message = 'Переданы некорректные данные в metadata';

      this.logger.warn(message);

      throw new RpcException({
        code: 3,
        message: message,
      });
    }

    const normalizedMetadata = {
      ...metadata,
      size: Number(metadata.size),
    };

    const { fileId } = await this.filesRepository.saveFile(normalizedMetadata);

    if (!fileId) {
      const message = 'В процессе сохранения файла произошла ошибка';
      this.logger.error(message);

      throw new RpcException({
        code: 13,
        message: message,
      });
    }
    try {
      await fs.promises.writeFile(
        join(this.FILE_DIR, fileId),
        Buffer.from(content),
      );

      this.logger.log(`Файл с id ${fileId} успешно сохранён.`);

      return { fileId };
    } catch (err) {
      const message = `В процессе сохранения файла произошла ошибка`;

      this.logger.error(
        `${message}: ${(err as Error).stack}`,
        (err as Error).stack,
      );

      throw new RpcException({
        code: 13,
        message: `В процессе сохранения файла произошла ошибка`,
      });
    }
  }

  async getListFiles(listFilesRequest: ListFilesRequest) {
    const { taskId } = listFilesRequest;
    this.logger.log(`List started: taskId=${taskId}`);

    try {
      const files = await this.filesRepository.getListFiles(listFilesRequest);

      this.logger.log(`Файлы для taskId ${taskId}: ${files.length} шт.`);

      if (!files.length) throw new NotFoundException();

      return { files };
    } catch (err) {
      if (err instanceof NotFoundException)
        throw new RpcException({
          code: 5,
          message: `Для данной задачи нет подходящих файлов`,
        });

      this.logger.error(
        `Ошибка чтения файла: taskId=${taskId}`,
        (err as Error).stack,
      );
      throw new RpcException({ code: 13, message: 'Внутренняя ошибка' });
    }
  }

  async deleteFile(deleteFileRequest: DeleteFileRequest) {
    const { fileId } = deleteFileRequest;
    this.logger.log(`Delete started: fileId=${fileId}`);

    this.fileIdValidator(fileId);

    try {
      await this.filesRepository.deleteFile(deleteFileRequest);
      await fs.promises.unlink(join(this.FILE_DIR, fileId));

      this.logger.log(`Файл с id ${fileId} успешно удалён.`);
    } catch (err) {
      this.logger.error(
        `В процессе удаления файла произошла ошибка: ${(err as Error).stack}`,
      );

      if (err instanceof RpcException) {
        throw err;
      }

      throw new RpcException({
        code: 13,
        message: 'Ошибка удаления файла',
      });
    }
  }

  async downloadFile(downloadFileRequest: DownloadFileRequest) {
    this.logger.log(
      `Download started: userId=${downloadFileRequest.userId}, fileId=${downloadFileRequest.fileId}`,
    );
    await this.filesRepository.downloadFileVerifyUser(downloadFileRequest);

    return defer(() => {
      const { fileId } = downloadFileRequest;

      this.fileIdValidator(fileId);
      this.logger.log(`Download stream opened: fileId=${fileId}`);

      return from(fs.createReadStream(join(this.FILE_DIR, fileId))).pipe(
        map((chunk: Buffer) => ({ chunk })),
        catchError((err) => {
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new RpcException({ code: 5, message: 'Файл не найден' });
          }
          throw new RpcException({ code: 13, message: 'Внутренняя ошибка' });
        }),
      );
    });
  }
}
