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
  UploadFileResponse,
} from '../proto/files/generated/files_service';
import { DownloadFileReqDto } from './dto/download-file.req.dto';
import { DeleteFileReqDto } from './dto/delete-file.req.dto';
import { ListFilesReqDto } from './dto/list-files.req.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../auth/user.entity';
import { GetUser } from '../auth/get-user.decorator';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('files')
@UseGuards(AuthGuard())
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  async uploadFile(
    @Body() uploadFileDto: UploadFileDto,
    @GetUser() user: User,
  ): Promise<UploadFileResponse> {
    return this.filesService.uploadFile(uploadFileDto, user);
  }

  @Get()
  async listFiles(
    @Query() listFilesRequest: ListFilesReqDto,
    @GetUser() user: User,
  ): Promise<ListFilesResponse> {
    return this.filesService.listFiles(listFilesRequest, user);
  }

  @Get(':fileId')
  downloadFile(
    @Param() downloadFileReqDto: DownloadFileReqDto,
    @GetUser() user: User,
  ): Promise<StreamableFile> {
    return this.filesService.downloadFile(downloadFileReqDto, user);
  }

  @Delete(':fileId')
  async deleteFile(
    @Param()
    deleteFileReqDto: DeleteFileReqDto,
    @GetUser() user: User,
  ): Promise<DeleteFileResponse> {
    return this.filesService.deleteFile(deleteFileReqDto, user);
  }
}
