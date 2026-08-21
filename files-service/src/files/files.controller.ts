import { Injectable, Logger } from '@nestjs/common';
import type {
  DeleteFileRequest,
  DownloadFileRequest,
  DownloadFileResponse,
  ListFilesRequest,
  ListFilesResponse,
  UploadFileRequest,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { FilesService } from './files.service';

@Injectable()
export class FilesController {
  private logger = new Logger('FilesController', { timestamp: true });

  constructor(private readonly filesService: FilesService) {}

  @GrpcMethod('FilesService', 'UploadFile')
  async saveFile(
    uploadFileRequest: UploadFileRequest,
  ): Promise<UploadFileResponse> {
    return this.filesService.saveFile(uploadFileRequest);
  }

  @GrpcMethod('FilesService', 'ListFiles')
  async getListFiles(
    listFilesRequest: ListFilesRequest,
  ): Promise<ListFilesResponse> {
    return this.filesService.getListFiles(listFilesRequest);
  }

  @GrpcMethod('FilesService', 'DeleteFile')
  async deleteFile(deleteFileRequest: DeleteFileRequest): Promise<void> {
    return this.filesService.deleteFile(deleteFileRequest);
  }

  @GrpcMethod('FilesService', 'DownloadFile')
  async downloadFile(
    downloadFileRequest: DownloadFileRequest,
  ): Promise<Observable<DownloadFileResponse>> {
    return this.filesService.downloadFile(downloadFileRequest);
  }
}
