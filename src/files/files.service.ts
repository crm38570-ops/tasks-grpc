import { firstValueFrom, map } from 'rxjs';
import {
  DeleteFileRequest,
  DeleteFileResponse,
  DownloadFileRequest,
  ListFilesRequest,
  ListFilesResponse,
  UploadFileRequest,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { FilesClientService } from './files-client.service';
import { eachValueFrom } from 'rxjs-for-await';
import { Injectable, StreamableFile } from '@nestjs/common';
import { Readable } from 'node:stream';

@Injectable()
export class FilesService {
  constructor(private readonly filesClientService: FilesClientService) {}

  async uploadFile(
    uploadFileRequest: UploadFileRequest,
  ): Promise<UploadFileResponse> {
    return firstValueFrom(
      this.filesClientService.uploadFile(uploadFileRequest),
    );
  }

  async listFiles(taskId: ListFilesRequest): Promise<ListFilesResponse> {
    return firstValueFrom(this.filesClientService.listFiles(taskId));
  }

  async deleteFile(fileId: DeleteFileRequest): Promise<DeleteFileResponse> {
    return firstValueFrom(this.filesClientService.deleteFile(fileId));
  }

  downloadFile(fileId: DownloadFileRequest): StreamableFile {
    const fileReadableStream = Readable.from(
      eachValueFrom(
        this.filesClientService
          .downloadFile(fileId)
          .pipe(map(({ chunk }) => chunk)),
      ),
    );

    return new StreamableFile(fileReadableStream);
  }
}
