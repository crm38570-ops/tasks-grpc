import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthedRequest } from '../../auth/jwt-auth.guard';
import { FilesProxyService } from './files-proxy.service';
import { TaskIdQueryDto, FileIdParamDto } from './dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  DeleteFileApi,
  DownloadFileApi,
  GetListFilesApi,
  UploadFileApi,
} from './swagger';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesProxyController {
  constructor(private readonly filesProxyService: FilesProxyService) {}

  @UploadFileApi()
  @Post('upload')
  uploadFile(@Req() request: AuthedRequest) {
    return this.filesProxyService.uploadFile(request);
  }

  @GetListFilesApi()
  @Get()
  getListFiles(
    @Query() { taskId }: TaskIdQueryDto,
    @Req() request: AuthedRequest,
  ) {
    return this.filesProxyService.getListFiles(taskId, request);
  }

  @DownloadFileApi()
  @Get(':fileId')
  async downloadFile(
    @Param() { fileId }: FileIdParamDto,
    @Query() { taskId }: TaskIdQueryDto,
    @Req() request: AuthedRequest,
  ): Promise<StreamableFile> {
    return this.filesProxyService.downloadFile(fileId, taskId, request);
  }

  @DeleteFileApi()
  @Delete(':fileId')
  deleteFile(
    @Param() { fileId }: FileIdParamDto,
    @Query() { taskId }: TaskIdQueryDto,
    @Req() request: AuthedRequest,
  ) {
    return this.filesProxyService.deleteFile(fileId, taskId, request);
  }
}
