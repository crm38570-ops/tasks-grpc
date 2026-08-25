import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  DeleteFileRequest,
  DeleteFileResponse,
  DownloadFileRequest,
  DownloadFileResponse,
  FilesServiceClient,
  ListFilesRequest,
  ListFilesResponse,
  UploadFileRequest,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Injectable()
export class FilesClientService implements OnModuleInit {
  private filesService: FilesServiceClient;

  constructor(@Inject('FILES_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.filesService =
      this.client.getService<FilesServiceClient>('FilesService');
  }

  uploadFile(
    uploadFileRequest: UploadFileRequest,
  ): Observable<UploadFileResponse> {
    return this.filesService.uploadFile(uploadFileRequest);
  }

  listFiles(request: ListFilesRequest): Observable<ListFilesResponse> {
    return this.filesService.listFiles(request);
  }

  downloadFile(request: DownloadFileRequest): Observable<DownloadFileResponse> {
    return this.filesService.downloadFile(request);
  }

  deleteFile(request: DeleteFileRequest): Observable<DeleteFileResponse> {
    return this.filesService.deleteFile(request);
  }
}
