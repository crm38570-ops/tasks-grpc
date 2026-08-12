import { Injectable } from '@nestjs/common';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  ListFilesRequest,
  ListFilesResponse,
  UploadFileRequest,
  UploadFileResponse,
} from '../../proto/files/generated/files_service';
import fs from 'node:fs';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { FilesRepository } from './files.repository';
import { join } from 'node:path';
import { UploadFileResValidator } from './services/upload-file.req.service';

@Injectable()
export class FilesService {
  private FILE_DIR: string;

  constructor(private readonly filesRepository: FilesRepository) {
    this.FILE_DIR = process.env.FILE_DIR!;
  }

  private fileIdChecker(fileId: string) {
    if (fileId.includes('..')) {
      throw new RpcException({ code: 3, message: 'Некорректный fileId' });
    }
  }

  @GrpcMethod('FilesService', 'UploadFile')
  async uploadFile(data: UploadFileRequest): Promise<UploadFileResponse> {
    const { metadata, content } = data;
    const isValid = UploadFileResValidator(data);

    if (isValid?.errors) throw isValid.errors;

    if (!metadata) {
      throw new RpcException({
        code: 3,
        message: `Переданы некорректные данные в metadata`,
      });
    }

    const { id } = await this.filesRepository.saveFileData(metadata);

    if (!id)
      throw new RpcException({
        code: 13,
        message: `В процессе сохранения файла произошла ошибка`,
      });

    await fs.promises.writeFile(join(this.FILE_DIR, id), Buffer.from(content));

    return { fileId: id };
  }

  @GrpcMethod('FilesService', 'ListFiles')
  async listFiles(taskId: ListFilesRequest): Promise<ListFilesResponse> {
    const files = await this.filesRepository.getListFiles(taskId);
    return { files: files };
  }

  @GrpcMethod('FilesService', 'DeleteFile')
  async deleteFile({ fileId }: DeleteFileRequest): Promise<void> {
    this.fileIdChecker(fileId);

    try {
      await fs.promises.unlink(join(this.FILE_DIR, fileId));
      await this.filesRepository.deleteFile(fileId);
    } catch (err) {
      throw new RpcException({
        code: 13,
        message: `В процессе удаления файла произошла ошибка: ${err}`,
      });
    }
  }

  @GrpcMethod('FilesService', 'DownloadFile')
  async downloadFile({ fileId }: DownloadFileRequest) {
    this.fileIdChecker(fileId);

    try {
      const file = await fs.promises.readFile(join(this.FILE_DIR, fileId));
      return { file };
    } catch {
      throw new RpcException({ code: 5, message: 'Файл не найден' });
    }
  }
}
