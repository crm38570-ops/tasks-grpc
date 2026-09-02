import { Controller, Logger, UsePipes } from '@nestjs/common';
import type {
  DownloadFileResponse,
  ListFilesResponse,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { GrpcMethod, GrpcStreamCall, RpcException } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Readable } from 'node:stream';
import { FilesService } from './files.service';
import { ListFilesRequestDto } from '../dto/list-files.request.dto';
import { DeleteFileRequestDto } from '../dto/delete-file.request.dto';
import { DownloadFileRequestDto } from '../dto/download-file.request.dto';
import { RpcValidationPipe } from '../pipes/validation.pipe';

@Controller()
@UsePipes(RpcValidationPipe)
export class FilesController {
  private readonly logger = new Logger('FilesController', { timestamp: true });

  constructor(private readonly filesService: FilesService) {
    // логгер понадобится для exception-filter; заглушка для noUnusedLocals
    void this.logger;
  }

  @GrpcStreamCall('FilesService', 'UploadFile')
  saveFile(
    request: Readable,
    callback: (err: unknown, res?: UploadFileResponse) => void,
  ): void {
    this.filesService.saveFile(request).then(
      (res) => callback(null, res),
      (err: unknown) =>
        callback(err instanceof RpcException ? err.getError() : err),
    );
  }

  @GrpcMethod('FilesService', 'ListFiles')
  async getListFiles(
    listFilesRequest: ListFilesRequestDto,
  ): Promise<ListFilesResponse> {
    this.logger.verbose(
      `List files request received: taskId=${listFilesRequest.taskId}, userId=${listFilesRequest.userId}`,
    );
    return this.filesService.getListFiles(listFilesRequest);
  }

  @GrpcMethod('FilesService', 'DeleteFile')
  async deleteFile(deleteFileRequest: DeleteFileRequestDto): Promise<void> {
    this.logger.verbose(
      `Delete file request received: fileId=${deleteFileRequest.fileId}, userId=${deleteFileRequest.userId}`,
    );
    return this.filesService.deleteFile(deleteFileRequest);
  }

  @GrpcMethod('FilesService', 'DownloadFile')
  async downloadFile(
    downloadFileRequest: DownloadFileRequestDto,
  ): Promise<Observable<DownloadFileResponse>> {
    this.logger.verbose(
      `Download file request received: fileId=${downloadFileRequest.fileId}, userId=${downloadFileRequest.userId}`,
    );
    return this.filesService.downloadFile(downloadFileRequest);
  }
}
