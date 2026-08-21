import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { FileEntity } from './file.entity';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  FileMetadataRequest,
  FileMetadataResponse,
  ListFilesRequest,
} from '../proto/files/generated/files_service';
import { DeleteResult } from 'typeorm/browser';

@Injectable()
export class FilesRepository extends Repository<FileEntity> {
  constructor(private dataSource: DataSource) {
    super(FileEntity, dataSource.createEntityManager());
  }

  async saveFile(
    fileMetadataRequest: FileMetadataRequest,
  ): Promise<FileEntity> {
    return await this.save(this.create(fileMetadataRequest));
  }

  async getListFiles(
    listFilesRequest: ListFilesRequest,
  ): Promise<FileMetadataResponse[]> {
    const query = this.createQueryBuilder('file');

    return await query.where({ ...listFilesRequest }).getMany();
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
