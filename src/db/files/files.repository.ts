import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { FileEntity } from './file.entity';
import { FileMetadata } from '../../proto/files/generated/files_service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class FilesRepository extends Repository<FileEntity> {
  constructor(private dataSource: DataSource) {
    super(FileEntity, dataSource.createEntityManager());
  }

  async saveFileData(fileMetadata: FileMetadata): Promise<FileEntity> {
    try {
      return this.save(this.create(fileMetadata));
    } catch (err) {
      throw new RpcException({
        code: 13,
        message: err as string,
      });
    }
  }

  async getListFiles({
    taskId,
  }: Pick<FileMetadata, 'taskId'>): Promise<FileMetadata[]> {
    const query = this.createQueryBuilder('file');

    try {
      const result = await query.where({ taskId }).getMany();
      return result;
    } catch (err) {
      throw new RpcException({
        code: 5,
        message: err as string,
      });
    }
  }

  async deleteFile(fileId: string) {
    try {
      await this.delete(fileId);
    } catch (err) {
      throw new RpcException({
        code: 13,
        message: err as string,
      });
    }
  }
}
