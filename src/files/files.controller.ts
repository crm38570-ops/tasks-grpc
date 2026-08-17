import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { FilesService } from './files.service';
import type {
  DeleteFileResponse,
  ListFilesResponse,
  UploadFileRequest,
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { DownloadFileReqDto } from './dto/download-file.req.dto';
import { DeleteFileReqDto } from './dto/delete-file.req.dto';
import { ListFilesReqDto } from './dto/list-files.req.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('files')
@UseGuards(AuthGuard())
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  async uploadFile(
    @Body() uploadFileRequest: UploadFileRequest,
  ): Promise<UploadFileResponse> {
    return this.filesService.uploadFile(uploadFileRequest);
  }

  @Get()
  async listFiles(
    @Query() listFilesRequest: ListFilesReqDto,
  ): Promise<ListFilesResponse> {
    return this.filesService.listFiles(listFilesRequest);
  }

  @Get(':fileId')
  downloadFile(
    @Param() downloadFileRequest: DownloadFileReqDto,
  ): StreamableFile {
    return this.filesService.downloadFile(downloadFileRequest);
  }

  @Delete(':fileId')
  async deleteFile(
    @Param()
    deleteFileRequest: DeleteFileReqDto,
  ): Promise<DeleteFileResponse> {
    return this.filesService.deleteFile(deleteFileRequest);
  }
}
