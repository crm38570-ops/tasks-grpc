import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map } from 'rxjs';
import { AxiosResponse } from 'axios';
import type { Readable } from 'node:stream';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthedRequest } from '../../auth/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesProxyController {
  private readonly tasksServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.tasksServiceUrl = config.getOrThrow('TASKS_SERVICE_URL');
  }

  @Post('upload')
  uploadFile(@Req() request: AuthedRequest) {
    return this.http
      .post(`${this.tasksServiceUrl}/files/upload`, request, {
        headers: {
          'X-User-Id': request.user.userId,
          'content-type': request.headers['content-type'],
          'content-length': request.headers['content-length'],
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get()
  getListFiles(@Req() request: AuthedRequest) {
    return this.http
      .get(`${this.tasksServiceUrl}/files`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Get(':fileId')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Req() request: AuthedRequest,
  ): Promise<StreamableFile> {
    const response = await firstValueFrom(
      this.http.get(`${this.tasksServiceUrl}/files/${fileId}`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
        responseType: 'stream',
      }),
    );

    return new StreamableFile(response.data as Readable, {
      type: response.headers['content-type'] as string | undefined,
      disposition: response.headers['content-disposition'] as
        string | undefined,
    });
  }

  @Delete(':fileId')
  deleteFile(@Param('fileId') fileId: string, @Req() request: AuthedRequest) {
    return this.http
      .delete(`${this.tasksServiceUrl}/files/${fileId}`, {
        headers: {
          'X-User-Id': request.user.userId,
        },
      })
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
