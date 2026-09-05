import { describe, it, expect, jest } from '@jest/globals';
import { PayloadTooLargeException, StreamableFile } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ClientGrpc } from '@nestjs/microservices';
import { of } from 'rxjs';
import type { FileMetadataResponse } from '../../../proto/files/generated/files_service';
import type { AuthedRequest } from '../../../auth/jwt-auth.guard';
import { FilesProxyService } from '../files-proxy.service';

const MAX_UPLOAD_SIZE = 10;

const makeService = (uploadReturn?: Parameters<typeof of>[0]) => {
  const stub = {
    uploadFile: jest.fn().mockReturnValue(of({ fileId: 'f-1' })),
    listFiles: jest.fn().mockReturnValue(of({ files: [] })),
    deleteFile: jest.fn().mockReturnValue(of({})),
    downloadFile: jest.fn().mockReturnValue(of(uploadReturn)),
  } as unknown as Record<string, jest.Mock>;
  const client = {
    getService: jest.fn().mockReturnValue(stub),
  } as unknown as ClientGrpc;
  const config = {
    getOrThrow: jest
      .fn()
      .mockImplementation((key: string) =>
        key === 'MAX_UPLOAD_SIZE' ? MAX_UPLOAD_SIZE : 5000,
      ),
  } as unknown as ConfigService;

  const service = new FilesProxyService(client, config);
  service.onModuleInit();

  return { service, stub };
};

const makeRequest = (headers: Record<string, unknown> = {}) =>
  ({
    headers,
    user: { userId: 'user-1', username: 'ivan' },
    once: jest.fn(),
    pipe: jest.fn(),
  }) as unknown as AuthedRequest;

describe(`FilesProxyService`, () => {
  describe(`uploadFile`, () => {
    it('кидает PayloadTooLarge, если content-length больше лимита', async () => {
      const { service, stub } = makeService();
      const request = makeRequest({
        'content-length': `${MAX_UPLOAD_SIZE + 1}`,
      });

      await expect(service.uploadFile(request)).rejects.toThrow(
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
        service.uploadFile(request).then(
          () => 'resolved',
          (error: unknown) => error,
        ),
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 200)),
      ]);

      expect(outcome).not.toBeInstanceOf(PayloadTooLargeException);
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
      const { service } = makeService({
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
      const { service } = makeService({
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
