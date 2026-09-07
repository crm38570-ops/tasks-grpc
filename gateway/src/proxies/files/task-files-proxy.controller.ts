import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthedRequest } from '../../auth/jwt-auth.guard';
import { FilesProxyService } from './files-proxy.service';
import { TaskIdParamDto } from './dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UploadFileApi } from './swagger';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('tasks/:taskId/files')
@UseGuards(JwtAuthGuard)
export class TaskFilesProxyController {
  constructor(private readonly filesProxyService: FilesProxyService) {}

  @UploadFileApi()
  @Post()
  uploadFile(
    @Param() { taskId }: TaskIdParamDto,
    @Req() request: AuthedRequest,
  ) {
    return this.filesProxyService.uploadFile(taskId, request);
  }
}
