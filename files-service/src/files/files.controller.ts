import { Controller, Logger, UsePipes } from '@nestjs/common';
import type {
  DownloadFileResponse,
  ListFilesResponse,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { FilesService } from './files.service';
import { UploadFileRequestDto } from '../dto/upload-file.request.dto';
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

  @GrpcMethod('FilesService', 'UploadFile')
  async saveFile(
    uploadFileRequest$: Observable<UploadFileRequestDto>,
  ): Promise<UploadFileResponse> {
    this.logger.verbose('Upload request received');
    return this.filesService.saveFile(uploadFileRequest$);
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
