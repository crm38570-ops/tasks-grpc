import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { FileEntity } from './file.entity';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  FileMetadataRequest,
  FileMetadataResponse,
  ListFilesRequest,
} from '../proto/files/generated/files_service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class FilesRepository extends Repository<FileEntity> {
  constructor(private dataSource: DataSource) {
    super(FileEntity, dataSource.createEntityManager());
  }

  async saveFile(
    fileMetadataRequest: FileMetadataRequest,
  ): Promise<FileEntity> {
    try {
      return await this.save(this.create(fileMetadataRequest));
    } catch (err) {
      if (err instanceof RpcException) {
        throw err;
      } else {
        throw new RpcException({ code: 13, message: 'Внутренняя ошибка' });
      }
    }
  }

  async getListFiles(
    listFilesRequest: ListFilesRequest,
  ): Promise<FileMetadataResponse[]> {
    const query = this.createQueryBuilder('file');

    try {
      const result = await query.where({ ...listFilesRequest }).getMany();
      return result;
    } catch (err) {
      throw new RpcException({
        code: 5,
        message: (err as Error).stack,
      });
    }
  }

  async deleteFile(deleteFileRequest: DeleteFileRequest): Promise<void> {
    try {
      const result = await this.delete({ ...deleteFileRequest });

      if (!result.affected)
        throw new NotFoundException(
          `Файл с ID: ${deleteFileRequest.fileId} не найден`,
        );
    } catch (err) {
      throw new RpcException({
        code: err instanceof NotFoundException ? 5 : 13,
        message: (err as Error).stack,
      });
    }
  }

  async downloadFileVerifyUser(
    downloadFileRequest: DownloadFileRequest,
  ): Promise<void> {
    const found = await this.createQueryBuilder('file')
      .where({ ...downloadFileRequest })
      .getOne();

    if (!found)
      throw new NotFoundException(
        `Файл с ID: ${downloadFileRequest.fileId} не найден`,
      );
  }
}
