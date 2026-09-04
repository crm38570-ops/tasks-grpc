import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  PayloadTooLargeException,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ClientGrpc } from '@nestjs/microservices';
import type { AuthedRequest } from '../../auth/jwt-auth.guard';
import { UploadFileDto } from './dto';
import type {
  DownloadFileResponse,
  FilesServiceClient,
  UploadFileRequest,
  UploadFileResponse,
} from '../../proto/files/generated/files_service';
import busboy from 'busboy';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { firstValueFrom, map, skip, Observable, ReplaySubject } from 'rxjs';
import { Readable } from 'node:stream';
import { eachValueFrom } from 'rxjs-for-await';
import { withDeadline } from '../shared/with-deadline';

@Injectable()
export class FilesProxyService implements OnModuleInit {
  private readonly logger = new Logger('FilesProxyService', {
    timestamp: true,
  });
  private readonly maxUploadSize: number;
  private readonly grpcTimeoutMs: number;
  private filesService!: FilesServiceClient;

  constructor(
    @Inject('FILES_GRPC_CLIENT') private readonly client: ClientGrpc,
    configService: ConfigService,
  ) {
    this.maxUploadSize = configService.getOrThrow<number>('MAX_UPLOAD_SIZE');
    this.grpcTimeoutMs = configService.getOrThrow<number>('GRPC_TIMEOUT_MS');
  }

  onModuleInit() {
    this.filesService =
      this.client.getService<FilesServiceClient>('FilesService');
  }

  async uploadFile(request: AuthedRequest): Promise<UploadFileResponse> {
    const { userId } = request.user;

    this.logger.verbose(`Upload file request: userId=${userId}`);

    const contentLength = Number(request.headers['content-length']);
    if (Number.isFinite(contentLength) && contentLength > this.maxUploadSize) {
      throw new PayloadTooLargeException('File is too large');
    }

    const bb = busboy({
      headers: request.headers,
      limits: { fileSize: this.maxUploadSize },
    });

    const grpcRequest$ = new Observable<UploadFileRequest>((subscriber) => {
      let taskId: string | undefined;
      let filePart:
        { stream: Readable; fileName: string; mimeType: string } | undefined;
      let started = false;

      const tryStart = () => {
        if (started || !taskId || !filePart) return;

        started = true;

        const { fileName, mimeType } = filePart;

        subscriber.next({
          content: new Uint8Array(0),
          metadata: {
            fileName,
            mimeType,
            taskId,
            userId,
          },
        });

        filePart.stream.on('data', (chunk: Buffer) =>
          subscriber.next({ content: chunk, metadata: undefined }),
        );

        filePart.stream.on('error', (error: Error) => subscriber.error(error));

        filePart.stream.resume();
      };

      bb.on('field', (name: string, value: string) => {
        if (name !== 'taskId') return;

        const errors = validateSync(
          plainToInstance(UploadFileDto, { taskId: value }),
        );

        if (errors.length > 0) {
          subscriber.error(new BadRequestException(errors));
          return;
        }

        taskId = value;

        tryStart();
      });

      bb.on('file', (name: string, stream: Readable, info) => {
        if (name !== 'file' || filePart) {
          stream.resume();
          return;
        }

        const { filename: fileName, mimeType } = info;

        stream.pause();

        filePart = {
          stream,
          fileName,
          mimeType,
        };

        stream.on('limit', () =>
          subscriber.error(new PayloadTooLargeException('File is too large')),
        );

        tryStart();
      });

      bb.on('limit', () =>
        subscriber.error(new PayloadTooLargeException('File is too large')),
      );
      bb.on('close', () => subscriber.complete());
      bb.on('error', (err: Error) => subscriber.error(err));

      request.pipe(bb);
      return () => {
        request.unpipe(bb);
      };
    });

    return firstValueFrom(this.filesService.uploadFile(grpcRequest$));
  }

  getListFiles(taskId: string, request: AuthedRequest) {
    const { userId } = request.user;

    this.logger.verbose(
      `List files request: userId=${userId}, taskId=${taskId}`,
    );

    return firstValueFrom(
      withDeadline(
        this.filesService.listFiles({ taskId, userId }),
        this.grpcTimeoutMs,
      ),
    );
  }

  async downloadFile(
    fileId: string,
    taskId: string,
    request: AuthedRequest,
  ): Promise<StreamableFile> {
    const { userId } = request.user;

    this.logger.verbose(
      `Download file : fileId=${fileId}, taskId=${taskId}, userId=${userId}`,
    );

    const responseSubject = new ReplaySubject<DownloadFileResponse>(1);

    const download$ = this.filesService.downloadFile({ fileId, userId });

    const subscription = download$.subscribe(responseSubject);

    request.once('close', () => subscription.unsubscribe());

    const firstResponse = await firstValueFrom(
      withDeadline(responseSubject, this.grpcTimeoutMs),
    );

    if (!firstResponse.metadata) {
      subscription.unsubscribe();
      throw new Error('Files service returned no metadata');
    }

    const fileReadableStream = Readable.from(
      eachValueFrom(
        responseSubject.pipe(
          skip(1),
          map(({ chunk }) => chunk),
        ),
      ),
    );

    const { mimeType, fileName } = firstResponse.metadata;

    const safeFileName = fileName.replace(/["\\\r\n]/g, '_');

    return new StreamableFile(fileReadableStream, {
      type: mimeType,
      disposition: `attachment; filename="${safeFileName}"`,
    });
  }

  deleteFile(fileId: string, taskId: string, request: AuthedRequest) {
    const { userId } = request.user;

    this.logger.verbose(
      `Delete file request: fileId=${fileId}, taskId=${taskId}, userId=${userId}`,
    );

    return firstValueFrom(
      withDeadline(
        this.filesService.deleteFile({ fileId, userId, taskId }),
        this.grpcTimeoutMs,
      ),
    );
  }
}
