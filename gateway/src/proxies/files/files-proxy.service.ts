import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  PayloadTooLargeException,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map } from 'rxjs';
import type { Readable } from 'node:stream';
import type { AuthedRequest } from '../../auth/jwt-auth.guard';

@Injectable()
export class FilesProxyService {
  private readonly logger = new Logger('FilesProxyService', {
    timestamp: true,
  });
  private readonly tasksServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.tasksServiceUrl = config.getOrThrow('TASKS_SERVICE_URL');
  }

  uploadFile(request: AuthedRequest) {
    const maxUploadSize = 10 * 1024 * 1024;
    const contentLength = Number(request.headers['content-length']);

    if (Number.isFinite(contentLength) && contentLength > maxUploadSize) {
      throw new PayloadTooLargeException('File is too large');
    }

    this.logger.verbose(`Upload file request: userId=${request.user.userId}`);
    return this.http
      .post<unknown>(`${this.tasksServiceUrl}/files/upload`, request, {
        headers: {
          Authorization: request.headers.authorization,
          'content-type': request.headers['content-type'],
          'content-length': request.headers['content-length'],
        },
        maxBodyLength: maxUploadSize,
      })
      .pipe(map((response) => response.data));
  }

  getListFiles(taskId: string, request: AuthedRequest) {
    this.logger.verbose(`List files request: userId=${request.user.userId}`);
    return this.http
      .get<unknown>(`${this.tasksServiceUrl}/files`, {
        params: { taskId },
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response) => response.data));
  }

  async downloadFile(
    fileId: string,
    taskId: string,
    request: AuthedRequest,
  ): Promise<StreamableFile> {
    this.logger.verbose(
      `Download file request: fileId=${fileId}, userId=${request.user.userId}`,
    );
    const response = await firstValueFrom(
      this.http.get(`${this.tasksServiceUrl}/files/${fileId}`, {
        params: { taskId },
        headers: {
          Authorization: request.headers.authorization,
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

  deleteFile(fileId: string, taskId: string, request: AuthedRequest) {
    this.logger.verbose(
      `Delete file request: fileId=${fileId}, userId=${request.user.userId}`,
    );
    return this.http
      .delete<unknown>(`${this.tasksServiceUrl}/files/${fileId}`, {
        params: { taskId },
        headers: {
          Authorization: request.headers.authorization,
        },
      })
      .pipe(map((response) => response.data));
  }
}
