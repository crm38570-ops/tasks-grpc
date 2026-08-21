import { Controller, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import type {
  DownloadFileResponse,
  ListFilesResponse,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { FilesService } from './files.service';
import { UploadFileRequestDto } from './dto/upload-file.request.dto';
import { ListFilesRequestDto } from './dto/list-files.request.dto';
import { DeleteFileRequestDto } from './dto/delete-file.request.dto';
import { DownloadFileRequestDto } from './dto/download-file.request.dto';
import { status } from '@grpc/grpc-js';
import { ValidationError } from 'class-validator';

@Controller()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    exceptionFactory: (errors) => {
      const collect = (errs: ValidationError[]): string[] =>
        errs.flatMap((e) => [
          ...Object.values(e.constraints ?? {}),
          ...(e.children?.length ? collect(e.children) : []),
        ]);

      return new RpcException({
        code: status.INVALID_ARGUMENT,
        message: collect(errors).join('; '),
      });
    },
  }),
)
export class FilesController {
  private logger = new Logger('FilesController', { timestamp: true });

  constructor(private readonly filesService: FilesService) {}

  @GrpcMethod('FilesService', 'UploadFile')
  async saveFile(
    uploadFileRequest: UploadFileRequestDto,
  ): Promise<UploadFileResponse> {
    return this.filesService.saveFile(uploadFileRequest);
  }

  @GrpcMethod('FilesService', 'ListFiles')
  async getListFiles(
    listFilesRequest: ListFilesRequestDto,
  ): Promise<ListFilesResponse> {
    return this.filesService.getListFiles(listFilesRequest);
  }

  @GrpcMethod('FilesService', 'DeleteFile')
  async deleteFile(deleteFileRequest: DeleteFileRequestDto): Promise<void> {
    return this.filesService.deleteFile(deleteFileRequest);
  }

  @GrpcMethod('FilesService', 'DownloadFile')
  async downloadFile(
    downloadFileRequest: DownloadFileRequestDto,
  ): Promise<Observable<DownloadFileResponse>> {
    return this.filesService.downloadFile(downloadFileRequest);
  }
}
