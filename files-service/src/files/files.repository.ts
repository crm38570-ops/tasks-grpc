import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  FileMetadataResponse,
  ListFilesRequest,
} from '../proto/files/generated/files_service';
import type { DeleteResult } from 'typeorm';
import { FileEntity } from './file.entity';

@Injectable()
export class FilesRepository extends Repository<FileEntity> {
  constructor(dataSource: DataSource) {
    super(FileEntity, dataSource.createEntityManager());
  }

  async saveFile(file: Omit<FileEntity, 'uploadedAt'>): Promise<FileEntity> {
    return await this.save(this.create(file));
  }

  getFile(fileId: string): Promise<FileEntity | null> {
    return this.createQueryBuilder('file').where({ fileId }).getOne();
  }

  async getListFiles(
    listFilesRequest: ListFilesRequest,
  ): Promise<FileMetadataResponse[]> {
    const query = this.createQueryBuilder('file');

    const files = await query.where({ ...listFilesRequest }).getMany();

    return files.map((file) => this.toMetadataResponse(file));
  }

  private toMetadataResponse(file: FileEntity): FileMetadataResponse {
    return {
      fileId: file.fileId,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: Number(file.size),
      taskId: file.taskId,
      uploadedAt: file.uploadedAt.toISOString(),
    };
  }

  async deleteFile(
    deleteFileRequest: DeleteFileRequest,
  ): Promise<DeleteResult> {
    return this.delete({ ...deleteFileRequest });
  }

  async downloadFileVerifyUser(
    downloadFileRequest: DownloadFileRequest,
  ): Promise<FileEntity | null> {
    return this.createQueryBuilder('file')
      .where({ ...downloadFileRequest })
      .getOne();
  }
}
