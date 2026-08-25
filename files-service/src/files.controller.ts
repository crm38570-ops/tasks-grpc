import { Controller, Logger, UsePipes } from '@nestjs/common';
import type {
  DownloadFileResponse,
  ListFilesResponse,
  UploadFileResponse,
} from './proto/files/generated/files_service';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { FilesService } from './files.service';
import { UploadFileRequestDto } from './dto/upload-file.request.dto';
import { ListFilesRequestDto } from './dto/list-files.request.dto';
import { DeleteFileRequestDto } from './dto/delete-file.request.dto';
import { DownloadFileRequestDto } from './dto/download-file.request.dto';
import { RpcValidationPipe } from './pipes/validation.pipe';

@Controller()
export class FilesController {
  private logger = new Logger('FilesController', { timestamp: true });

  constructor(private readonly filesService: FilesService) {}

  @GrpcMethod('FilesService', 'UploadFile')
  async saveFile(
    uploadFileRequest$: Observable<UploadFileRequestDto>,
  ): Promise<UploadFileResponse> {
    return this.filesService.saveFile(uploadFileRequest$);
  }

  @GrpcMethod('FilesService', 'ListFiles')
  @UsePipes(RpcValidationPipe)
  async getListFiles(
    listFilesRequest: ListFilesRequestDto,
  ): Promise<ListFilesResponse> {
    return this.filesService.getListFiles(listFilesRequest);
  }

  @GrpcMethod('FilesService', 'DeleteFile')
  @UsePipes(RpcValidationPipe)
  async deleteFile(deleteFileRequest: DeleteFileRequestDto): Promise<void> {
    return this.filesService.deleteFile(deleteFileRequest);
  }

  @GrpcMethod('FilesService', 'DownloadFile')
  @UsePipes(RpcValidationPipe)
  async downloadFile(
    downloadFileRequest: DownloadFileRequestDto,
  ): Promise<Observable<DownloadFileResponse>> {
    return this.filesService.downloadFile(downloadFileRequest);
  }
}
