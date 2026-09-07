import { describe, it, expect, jest } from '@jest/globals';
import {
  BadRequestException,
  PayloadTooLargeException,
  StreamableFile,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ClientGrpc } from '@nestjs/microservices';
import { of, Observable } from 'rxjs';
import { PassThrough } from 'node:stream';
import type { FileMetadataResponse } from '../../../proto/files/generated/files_service';
import type { AuthedRequest, JwtPayload } from '../../../auth/jwt-auth.guard';
import type { UploadFileRequest } from '../../../proto/files/generated/files_service';
import { FilesProxyService } from '../files-proxy.service';

const MAX_UPLOAD_SIZE = 64;
const TASK_ID = '0b8f6c0a-1111-4222-8333-444455556666';
const BOUNDARY = 'test-boundary';

const makeService = (
  maxUploadSize: number = MAX_UPLOAD_SIZE,
  downloadReturn?: Parameters<typeof of>[0],
) => {
  const stub = {
    uploadFile: jest.fn(),
    listFiles: jest.fn().mockReturnValue(of({ files: [] })),
    deleteFile: jest.fn().mockReturnValue(of({})),
    downloadFile: jest.fn().mockReturnValue(of(downloadReturn)),
  } as unknown as Record<string, jest.Mock>;

  const uploaded: {
    messages: UploadFileRequest[];
    error: unknown;
    completed: boolean;
  } = { messages: [], error: undefined, completed: false };

  stub.uploadFile.mockImplementation(
    (grpcRequest$: Observable<UploadFileRequest>) =>
      new Observable((subscriber) => {
        grpcRequest$.subscribe({
          next: (message) => uploaded.messages.push(message),
          error: (error: unknown) => {
            uploaded.error = error;
            subscriber.error(error);
          },
          complete: () => {
            uploaded.completed = true;
            subscriber.next({ fileId: 'f-1' });
          },
        });
      }),
  );

  const client = {
    getService: jest.fn().mockReturnValue(stub),
  } as unknown as ClientGrpc;
  const config = {
    getOrThrow: jest
      .fn()
      .mockImplementation((key: string) =>
        key === 'MAX_UPLOAD_SIZE' ? maxUploadSize : 5000,
      ),
  } as unknown as ConfigService;

  const service = new FilesProxyService(client, config);
  service.onModuleInit();

  return { service, stub, uploaded };
};

const makeRequest = (headers: Record<string, unknown> = {}) =>
  ({
    headers,
    user: { userId: 'user-1', username: 'ivan' },
    once: jest.fn(),
    pipe: jest.fn(),
  }) as unknown as AuthedRequest;

const makeMultipartRequest = () => {
  const request = new PassThrough();
  request.headers = {
    'content-type': `multipart/form-data; boundary=${BOUNDARY}`,
  };
  (request as PassThrough & { user: JwtPayload }).user = {
    userId: 'user-1',
    username: 'ivan',
  };
  return request as unknown as AuthedRequest;
};

const multipartBody = (
  fileContent: Buffer,
  fileName = 'a.txt',
  mimeType = 'text/plain',
) =>
  Buffer.concat([
    Buffer.from(
      `--${BOUNDARY}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`,
    ),
    fileContent,
    Buffer.from(`\r\n--${BOUNDARY}--\r\n`),
  ]);

const fileChunks = (uploaded: { messages: UploadFileRequest[] }) =>
  Buffer.concat(
    uploaded.messages.slice(1).map(({ content }) => Buffer.from(content)),
  );

const sendBody = (
  request: PassThrough,
  body: Buffer,
  chunkSize = 64 * 1024,
) => {
  for (let offset = 0; offset < body.length; offset += chunkSize) {
    request.write(body.subarray(offset, offset + chunkSize));
  }
  request.end();
};

describe(`FilesProxyService`, () => {
  describe(`uploadFile`, () => {
    it('кидает PayloadTooLarge, если content-length больше лимита', async () => {
      const { service, stub } = makeService();
      const request = makeRequest({
        'content-length': `${MAX_UPLOAD_SIZE + 1}`,
      });

      await expect(service.uploadFile(TASK_ID, request)).rejects.toThrow(
        PayloadTooLargeException,
      );
      expect(stub.uploadFile).not.toHaveBeenCalled();
    });

    it('пропускает запрос, если content-length равен лимиту', async () => {
      const { service } = makeService();
      const request = makeRequest({
        'content-length': `${MAX_UPLOAD_SIZE}`,
        'content-type': 'multipart/form-data; boundary=test-boundary',
      });

      const outcome = await Promise.race([
        service.uploadFile(TASK_ID, request).then(
          () => 'resolved',
          (error: unknown) => error,
        ),
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 200)),
      ]);

      expect(outcome).not.toBeInstanceOf(PayloadTooLargeException);
    });

    it('кидает BadRequest для некорректного taskId до начала загрузки', async () => {
      const { service, stub } = makeService();
      const request = makeMultipartRequest();

      await expect(service.uploadFile('not-a-uuid', request)).rejects.toThrow(
        BadRequestException,
      );
      expect(stub.uploadFile).not.toHaveBeenCalled();
    });

    it('загружает файл и передаёт taskId из URL в gRPC metadata', async () => {
      const { service, uploaded } = makeService();
      const request = makeMultipartRequest();
      const fileContent = Buffer.from('hello world');

      const promise = service.uploadFile(TASK_ID, request);
      sendBody(request, multipartBody(fileContent));
      const result = await promise;

      expect(result).toEqual({ fileId: 'f-1' });
      expect(uploaded.completed).toBe(true);
      expect(uploaded.messages.length).toBeGreaterThanOrEqual(2);
      expect(uploaded.messages[0].metadata).toEqual({
        fileName: 'a.txt',
        mimeType: 'text/plain',
        taskId: TASK_ID,
        userId: 'user-1',
      });
      expect(fileChunks(uploaded)).toEqual(fileContent);
    });

    it('стримит файл больше внутреннего буфера busboy без зависания', async () => {
      const { service, uploaded } = makeService(2 * 1024 * 1024);
      const request = makeMultipartRequest();
      const fileContent = Buffer.alloc(1024 * 1024, 7);

      const promise = service.uploadFile(TASK_ID, request);
      sendBody(request, multipartBody(fileContent));
      await promise;

      expect(uploaded.completed).toBe(true);
      expect(uploaded.messages.length - 1).toBeGreaterThan(1);
      expect(fileChunks(uploaded)).toEqual(fileContent);
    });

    it('кидает BadRequest, если multipart не содержит file', async () => {
      const { service } = makeService();
      const request = makeMultipartRequest();

      const promise = service.uploadFile(TASK_ID, request);
      sendBody(request, Buffer.from(`--${BOUNDARY}--\r\n`));

      await expect(promise).rejects.toThrow(BadRequestException);
    });

    it('кидает PayloadTooLarge, если файл превышает MAX_UPLOAD_SIZE', async () => {
      const { service } = makeService();
      const request = makeMultipartRequest();

      const promise = service.uploadFile(TASK_ID, request);
      sendBody(request, multipartBody(Buffer.alloc(128, 1)));

      await expect(promise).rejects.toThrow(PayloadTooLargeException);
    });
  });

  describe(`getListFiles`, () => {
    it('передаёт taskId и userId', async () => {
      const { service, stub } = makeService();

      const result = await service.getListFiles('task-1', makeRequest());

      expect(stub.listFiles).toHaveBeenCalledWith({
        taskId: 'task-1',
        userId: 'user-1',
      });
      expect(result).toEqual({ files: [] });
    });
  });

  describe(`deleteFile`, () => {
    it('передаёт fileId, taskId и userId', async () => {
      const { service, stub } = makeService();

      await service.deleteFile('file-1', 'task-1', makeRequest());

      expect(stub.deleteFile).toHaveBeenCalledWith({
        fileId: 'file-1',
        taskId: 'task-1',
        userId: 'user-1',
      });
    });
  });

  describe(`downloadFile`, () => {
    it('кидает ошибку, если files-service вернул ответ без метаданных', async () => {
      const { service } = makeService(MAX_UPLOAD_SIZE, {
        metadata: undefined,
        chunk: new Uint8Array(),
      });

      await expect(
        service.downloadFile('file-1', 'task-1', makeRequest()),
      ).rejects.toThrow('Files service returned no metadata');
    });

    it('санитизирует имя файла в Content-Disposition', async () => {
      const metadata: FileMetadataResponse = {
        fileId: 'file-1',
        fileName: 'a"b\\c\r\nd.txt',
        mimeType: 'text/plain',
        size: 1,
        taskId: 'task-1',
        uploadedAt: '2026-01-01T00:00:00Z',
      };
      const { service } = makeService(MAX_UPLOAD_SIZE, {
        metadata,
        chunk: new Uint8Array(),
      });

      const result = await service.downloadFile(
        'file-1',
        'task-1',
        makeRequest(),
      );

      expect(result).toBeInstanceOf(StreamableFile);
      expect(result.options?.disposition).toBe(
        'attachment; filename="a_b_c__d.txt"',
      );
      expect(result.options?.type).toBe('text/plain');
    });
  });
});
