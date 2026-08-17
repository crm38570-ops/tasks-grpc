import { firstValueFrom, map } from 'rxjs';
import {
  DeleteFileResponse,
  ListFilesResponse,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { FilesClientService } from './files-client.service';
import { eachValueFrom } from 'rxjs-for-await';
import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { Readable } from 'node:stream';
import { User } from '../auth/user.entity';
import { UploadFileDto } from './dto/upload-file.dto';
import { ListFilesReqDto } from './dto/list-files.req.dto';
import { TasksService } from '../tasks/tasks.service';
import { DownloadFileReqDto } from './dto/download-file.req.dto';
import { DeleteFileReqDto } from './dto/delete-file.req.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly filesClientService: FilesClientService,
    private readonly tasksService: TasksService,
  ) {}

  async uploadFile(
    uploadFileDto: UploadFileDto,
    user: User,
  ): Promise<UploadFileResponse> {
    const { taskId } = uploadFileDto.metadata;

    await this.validateUserTask(taskId, user);

    const uploadFileRequest = {
      ...uploadFileDto,
      metadata: { ...uploadFileDto.metadata, userId: user.id },
    };

    return firstValueFrom(
      this.filesClientService.uploadFile(uploadFileRequest),
    );
  }

  async listFiles(
    { taskId }: ListFilesReqDto,
    user: User,
  ): Promise<ListFilesResponse> {
    return firstValueFrom(
      this.filesClientService.listFiles({ taskId, userId: user.id }),
    );
  }

  async downloadFile(
    downloadFileDto: DownloadFileReqDto,
    user: User,
  ): Promise<StreamableFile> {
    const { fileId, taskId } = downloadFileDto;

    await this.validateUserTask(taskId, user);

    const fileReadableStream = Readable.from(
      eachValueFrom(
        this.filesClientService
          .downloadFile({ fileId, userId: user.id })
          .pipe(map(({ chunk }) => chunk)),
      ),
    );

    return new StreamableFile(fileReadableStream);
  }

  async deleteFile(
    deleteFileDto: DeleteFileReqDto,
    user: User,
  ): Promise<DeleteFileResponse> {
    const { taskId, fileId } = deleteFileDto;

    await this.validateUserTask(taskId, user);

    return firstValueFrom(
      this.filesClientService.deleteFile({ fileId, userId: user.id }),
    );
  }

  async validateUserTask(taskId: string, user: User) {
    const found = await this.tasksService.getTaskById(taskId, user);

    if (!found)
      throw new NotFoundException(
        `У пользователя ${user.username} нет задачи с ID: ${taskId}`,
      );
  }
}
