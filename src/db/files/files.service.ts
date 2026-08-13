import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  DownloadFileResponse,
  ListFilesRequest,
  ListFilesResponse,
  UploadFileRequest,
  UploadFileResponse,
} from '../../proto/files/generated/files_service';
import fs from 'node:fs';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { FilesRepository } from './files.repository';
import { join } from 'node:path';
import { UploadFileReqValidator } from './services/upload-file.req.service';
import { catchError, defer, from, map, Observable } from 'rxjs';

@Injectable()
export class FilesService {
  private FILE_DIR: string;
  private logger = new Logger('FilesService', { timestamp: true });

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

  private fileIdChecker(fileId: string) {
    if (fileId.includes('..')) {
      const message = 'Некорректный fileId';
      this.logger.warn(message);
      throw new RpcException({ code: 3, message: message });
    }
  }

  @GrpcMethod('FilesService', 'UploadFile')
  async uploadFile(data: UploadFileRequest): Promise<UploadFileResponse> {
    const { metadata, content } = data;
    const isValid = UploadFileReqValidator(data);

    if (isValid?.errors) throw isValid.errors;

    if (!metadata) {
      const message = 'Переданы некорректные данные в metadata';

      this.logger.warn(message);

      throw new RpcException({
        code: 3,
        message: message,
      });
    }

    const { id } = await this.filesRepository.saveFileData(metadata);

    if (!id) {
      const message = 'В процессе сохранения файла произошла ошибка';
      this.logger.error(message);

      throw new RpcException({
        code: 13,
        message: message,
      });
    }
    try {
      await fs.promises.writeFile(
        join(this.FILE_DIR, id),
        Buffer.from(content),
      );

      this.logger.log(`Файл с id ${id} успешно сохранён.`);

      return { fileId: id };
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

  @GrpcMethod('FilesService', 'ListFiles')
  async listFiles({ taskId }: ListFilesRequest): Promise<ListFilesResponse> {
    try {
      const files = await this.filesRepository.getListFiles(taskId);

      this.logger.log(`Файлы для taskId ${taskId}: ${files.length} шт.`);

      return { files };
    } catch (err) {
      this.logger.error(
        `Ошибка чтения файла: taskId=${taskId}`,
        (err as Error).stack,
      );
      throw new RpcException({ code: 13, message: 'Внутренняя ошибка' });
    }
  }

  @GrpcMethod('FilesService', 'DeleteFile')
  async deleteFile({ fileId }: DeleteFileRequest): Promise<void> {
    this.fileIdChecker(fileId);

    try {
      await fs.promises.unlink(join(this.FILE_DIR, fileId));
      await this.filesRepository.deleteFile(fileId);

      this.logger.log(`Файл с id ${fileId} успешно удалён.`);
    } catch (err) {
      this.logger.error(
        `В процессе удаления файла произошла ошибка: ${(err as Error).stack}`,
      );

      throw new RpcException({
        code: 13,
        message: 'В процессе удаления файла произошла ошибка',
      });
    }
  }

  @GrpcMethod('FilesService', 'DownloadFile')
  downloadFile({
    fileId,
  }: DownloadFileRequest): Observable<DownloadFileResponse> {
    return defer(() => {
      this.fileIdChecker(fileId);

      return from(fs.createReadStream(join(this.FILE_DIR, fileId))).pipe(
        map((chunk: Buffer) => ({ file: chunk })),
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
