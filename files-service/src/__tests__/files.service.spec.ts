import {
  describe,
  it,
  jest,
  beforeAll,
  beforeEach,
  afterAll,
  expect,
} from '@jest/globals';
import { FilesService } from '../files/files.service';
import { FilesRepository } from '../files/files.repository';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  FileMetadataRequest,
  FileMetadataResponse,
  ListFilesRequest,
} from '../proto/files/generated/files_service';
import { DeleteResult } from 'typeorm';
import { FileEntity } from '../files/file.entity';
import { RpcException } from '@nestjs/microservices';
import fs from 'node:fs';
import { Readable, Writable } from 'node:stream';
import { lastValueFrom, toArray } from 'rxjs';
import { UploadFileRequestDto } from '../dto/upload-file.request.dto';
import { mockFileUserId, mockTaskUserId } from './variables';
import { Logger } from '@nestjs/common';
import { TaskOwnershipService } from '../files/tasks-internal/task-ownership.service';
import { ConfigService } from '@nestjs/config';

describe('FilesService', () => {
  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.FILE_DIR = './storage';
    service = new FilesService(
      mockRepo as unknown as FilesRepository,
      mockTaskOwnership as unknown as TaskOwnershipService,
      mockConfig as unknown as ConfigService,
    );
  });

  const mockConfig = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'FILE_DIR') return './storage';
      if (key === 'MAX_UPLOAD_SIZE') return 10 * 1024 * 1024;
      return undefined;
    }),
  };

  const mockRepo = {
    saveFile:
      jest.fn<
        (
          metadata: FileMetadataRequest & { fileId: string },
        ) => Promise<FileEntity>
      >(),
    getFile: jest.fn<(fileId: string) => Promise<FileEntity | null>>(),
    getListFiles:
      jest.fn<
        (listFilesRequest: ListFilesRequest) => Promise<FileMetadataResponse[]>
      >(),
    deleteFile:
      jest.fn<
        (deleteFileRequest: DeleteFileRequest) => Promise<DeleteResult>
      >(),
    downloadFileVerifyUser:
      jest.fn<
        (downloadFileRequest: DownloadFileRequest) => Promise<FileEntity | null>
      >(),
  };

  const mockTaskOwnership = {
    validateTaskOwner:
      jest.fn<(taskId: string, userId: string) => Promise<void>>(),
  };

  it('saveFile успешно сохраняет файл', async () => {
    const metadata = {
      fileName: 'cat.png',
      mimeType: 'image/png',
      taskId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
    };

    const writeTarget: Buffer[] = [];
    const fakeWriteStream = new Writable({
      write(chunk, _encoding, callback) {
        const buffer = Buffer.from(chunk as Buffer);

        if (buffer.length) writeTarget.push(buffer);

        callback();
      },
    });

    const createWriteStreamSpy = jest
      .spyOn(fs, 'createWriteStream')
      .mockReturnValue(fakeWriteStream as fs.WriteStream);

    const unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);

    mockRepo.saveFile.mockResolvedValue({
      fileId: 'mock-id',
    } as FileEntity);

    try {
      const result = await service.saveFile(
        Readable.from<UploadFileRequestDto>([
          { content: new Uint8Array(0), metadata } as UploadFileRequestDto,
          {
            content: new Uint8Array([1, 2, 3]),
            metadata: undefined,
          } as UploadFileRequestDto,
        ]),
      );

      expect(result.fileId).toEqual(expect.any(String));
      expect(writeTarget).toEqual([Buffer.from([1, 2, 3])]);
      expect(mockTaskOwnership.validateTaskOwner).toHaveBeenCalledWith(
        metadata.taskId,
        metadata.userId,
      );
      expect(mockRepo.saveFile).toHaveBeenCalledWith({
        fileId: expect.any(String),
        ...metadata,
        size: 3,
      });
      expect(unlinkSpy).not.toHaveBeenCalled();
    } finally {
      createWriteStreamSpy.mockRestore();
      unlinkSpy.mockRestore();
    }
  });

  it('saveFile закрывает стрим до удаления файла с диска при ошибке', async () => {
    const calls: string[] = [];

    const fakeWriteStream = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
    fakeWriteStream.on('close', () => calls.push('close'));

    const createWriteStreamSpy = jest
      .spyOn(fs, 'createWriteStream')
      .mockReturnValue(fakeWriteStream as fs.WriteStream);

    const unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockImplementation(() => {
        calls.push('unlink');
        return Promise.resolve(undefined);
      });

    try {
      await expect(
        service.saveFile(Readable.from<UploadFileRequestDto>([])),
      ).rejects.toBeInstanceOf(RpcException);

      expect(calls).toEqual(['close', 'unlink']);
    } finally {
      createWriteStreamSpy.mockRestore();
      unlinkSpy.mockRestore();
    }
  });

  it('saveFile возвращает RpcException с кодом 3, если поток пуст', async () => {
    const createWriteStreamSpy = jest
      .spyOn(fs, 'createWriteStream')
      .mockReturnValue(new Writable() as fs.WriteStream);

    const unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);

    try {
      let caughtError: unknown;

      try {
        await service.saveFile(Readable.from<UploadFileRequestDto>([]));
      } catch (err: unknown) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(RpcException);
      expect((caughtError as RpcException).getError()).toEqual({
        code: 3,
        message: 'Пустой поток',
      });
      expect(mockRepo.saveFile).not.toHaveBeenCalled();
      expect(unlinkSpy).toHaveBeenCalled();
    } finally {
      createWriteStreamSpy.mockRestore();
      unlinkSpy.mockRestore();
    }
  });

  it('saveFile возвращает RpcException с кодом 7, если задача не принадлежит пользователю', async () => {
    const createWriteStreamSpy = jest
      .spyOn(fs, 'createWriteStream')
      .mockReturnValue(new Writable() as fs.WriteStream);

    const unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);

    mockTaskOwnership.validateTaskOwner.mockRejectedValue(
      new RpcException({
        code: 7,
        message: 'Задача не найдена или недоступна пользователю',
      }),
    );

    try {
      let caughtError: unknown;

      try {
        await service.saveFile(
          Readable.from<UploadFileRequestDto>([
            {
              content: new Uint8Array([1, 2, 3]),
              metadata: {
                fileName: 'cat.png',
                mimeType: 'image/png',
                taskId: '11111111-1111-4111-8111-111111111111',
                userId: '22222222-2222-4222-8222-222222222222',
              },
            } as UploadFileRequestDto,
          ]),
        );
      } catch (err: unknown) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(RpcException);
      expect((caughtError as RpcException).getError()).toEqual({
        code: 7,
        message: 'Задача не найдена или недоступна пользователю',
      });
      expect(mockRepo.saveFile).not.toHaveBeenCalled();
      expect(unlinkSpy).toHaveBeenCalled();
    } finally {
      createWriteStreamSpy.mockRestore();
      unlinkSpy.mockRestore();
    }
  });

  it('saveFile возвращает RpcException, если metadata невалидна', async () => {
    const createWriteStreamSpy = jest
      .spyOn(fs, 'createWriteStream')
      .mockReturnValue(new Writable() as fs.WriteStream);

    const unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);

    try {
      let caughtError: unknown;

      try {
        await service.saveFile(
          Readable.from<UploadFileRequestDto>([
            {
              content: new Uint8Array(0),
              metadata: {
                fileName: 'cat.png',
                mimeType: 'image/png',
                taskId: 'not-a-uuid',
                userId: '22222222-2222-4222-8222-222222222222',
              },
            } as UploadFileRequestDto,
          ]),
        );
      } catch (err: unknown) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(RpcException);
      expect(mockRepo.saveFile).not.toHaveBeenCalled();
      expect(unlinkSpy).toHaveBeenCalled();
    } finally {
      createWriteStreamSpy.mockRestore();
      unlinkSpy.mockRestore();
    }
  });

  it('getListFiles возвращает файлы, которые нашёл репозиторий', async () => {
    const file: FileMetadataResponse = {
      fileId: 'id-1',
      fileName: 'cat.png',
      mimeType: 'image/png',
      size: 100,
      taskId: 'task-1',
      uploadedAt: String(new Date(Date.now())),
    };

    mockRepo.getListFiles.mockResolvedValue([file] as FileMetadataResponse[]);

    const result = await service.getListFiles(mockTaskUserId);

    expect(mockRepo.getListFiles).toHaveBeenCalledWith(mockTaskUserId);
    expect(result).toEqual({ files: [file] });
  });

  it('getListFiles возвращает пустой список, если для задачи нет файлов', async () => {
    mockRepo.getListFiles.mockResolvedValue([] as FileMetadataResponse[]);

    await expect(service.getListFiles(mockTaskUserId)).resolves.toEqual({
      files: [],
    });

    expect(mockRepo.getListFiles).toHaveBeenCalledWith(mockTaskUserId);
  });

  it('deleteFile успешно удаляет файл', async () => {
    mockRepo.getFile.mockResolvedValue({
      fileId: mockFileUserId.fileId,
      userId: mockFileUserId.userId,
      taskId: mockFileUserId.taskId,
    } as FileEntity);
    mockTaskOwnership.validateTaskOwner.mockResolvedValue();
    mockRepo.deleteFile.mockResolvedValue({ affected: 1 } as DeleteResult);

    const unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);

    try {
      await expect(service.deleteFile(mockFileUserId)).resolves.toBeUndefined();

      expect(mockRepo.getFile).toHaveBeenCalledWith(mockFileUserId.fileId);
      expect(mockTaskOwnership.validateTaskOwner).toHaveBeenCalledWith(
        mockFileUserId.taskId,
        mockFileUserId.userId,
      );
      expect(mockRepo.deleteFile).toHaveBeenCalledWith(mockFileUserId);
      expect(unlinkSpy).toHaveBeenCalled();

      const deleteCallOrder = mockRepo.deleteFile.mock.invocationCallOrder[0];
      const unlinkCallOrder = unlinkSpy.mock.invocationCallOrder[0];
      expect(deleteCallOrder).toBeLessThan(unlinkCallOrder);
    } finally {
      unlinkSpy.mockRestore();
    }
  });

  it(`deleteFile выбрасывает RpcException с кодом 5, если файл прикреплён к другой задаче`, async () => {
    mockRepo.getFile.mockResolvedValue({
      fileId: mockFileUserId.fileId,
      userId: mockFileUserId.userId,
      taskId: 'другая задача',
    } as FileEntity);
    mockTaskOwnership.validateTaskOwner.mockResolvedValue();

    const unlinkSpy = jest.spyOn(fs.promises, 'unlink');

    let caughtError: unknown;

    try {
      await service.deleteFile(mockFileUserId);
    } catch (err: unknown) {
      caughtError = err;
    } finally {
      unlinkSpy.mockRestore();
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 5,
      message: 'Файл не найден',
    });

    expect(mockRepo.getFile).toHaveBeenCalledWith(mockFileUserId.fileId);
    expect(mockTaskOwnership.validateTaskOwner).toHaveBeenCalledWith(
      mockFileUserId.taskId,
      mockFileUserId.userId,
    );
    expect(mockRepo.deleteFile).not.toHaveBeenCalled();
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it(`deleteFile пробрасывает ошибку, если задача не принадлежит пользователю`, async () => {
    const error = new RpcException({
      code: 7,
      message: 'Задача не найдена или недоступна пользователю',
    });

    mockRepo.getFile.mockResolvedValue({
      fileId: mockFileUserId.fileId,
      userId: mockFileUserId.userId,
      taskId: mockFileUserId.taskId,
    } as FileEntity);
    mockTaskOwnership.validateTaskOwner.mockRejectedValue(error);

    const unlinkSpy = jest.spyOn(fs.promises, 'unlink');

    let caughtError: unknown;

    try {
      await service.deleteFile(mockFileUserId);
    } catch (err: unknown) {
      caughtError = err;
    } finally {
      unlinkSpy.mockRestore();
    }

    expect(caughtError).toBe(error);
    expect(mockRepo.deleteFile).not.toHaveBeenCalled();
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('deleteFile не удаляет файл с диска, если БД вернула ошибку', async () => {
    const error = new RpcException({
      code: 5,
      message: 'Файл не найден',
    });

    mockRepo.getFile.mockResolvedValue({
      fileId: mockFileUserId.fileId,
      userId: mockFileUserId.userId,
      taskId: mockFileUserId.taskId,
    } as FileEntity);
    mockTaskOwnership.validateTaskOwner.mockResolvedValue();
    mockRepo.deleteFile.mockRejectedValue(error);

    const unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);

    let caughtError: unknown;

    try {
      try {
        await service.deleteFile(mockFileUserId);
      } catch (err: unknown) {
        caughtError = err;
      }

      expect(caughtError).toBe(error);
      expect(caughtError).toBeInstanceOf(RpcException);

      expect((caughtError as RpcException).getError()).toEqual({
        code: 5,
        message: 'Файл не найден',
      });

      expect(unlinkSpy).not.toHaveBeenCalled();
      expect(mockRepo.deleteFile).toHaveBeenCalledWith(mockFileUserId);
    } finally {
      unlinkSpy.mockRestore();
    }
  });

  it(`deleteFile пробрасывает неизвестную ошибку как есть`, async () => {
    const error = new Error('Ошибка');

    mockRepo.getFile.mockResolvedValue({
      fileId: mockFileUserId.fileId,
      userId: mockFileUserId.userId,
      taskId: mockFileUserId.taskId,
    } as FileEntity);
    mockTaskOwnership.validateTaskOwner.mockResolvedValue();
    mockRepo.deleteFile.mockRejectedValue(error);

    const unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);

    let caughtError: unknown;

    try {
      try {
        await service.deleteFile(mockFileUserId);
      } catch (err: unknown) {
        caughtError = err;
      }

      expect(caughtError).toBe(error);
      expect(unlinkSpy).not.toHaveBeenCalled();
      expect(mockRepo.deleteFile).toHaveBeenCalledWith(mockFileUserId);
    } finally {
      unlinkSpy.mockRestore();
    }
  });

  it(`deleteFile выбрасывает RpcException с кодом 5, если affected равен 0`, async () => {
    mockRepo.getFile.mockResolvedValue({
      fileId: mockFileUserId.fileId,
      userId: mockFileUserId.userId,
      taskId: mockFileUserId.taskId,
    } as FileEntity);
    mockTaskOwnership.validateTaskOwner.mockResolvedValue();
    mockRepo.deleteFile.mockResolvedValue({ affected: 0 } as DeleteResult);

    const unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);

    let caughtError: unknown;

    try {
      try {
        await service.deleteFile(mockFileUserId);
      } catch (err: unknown) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(RpcException);
      expect((caughtError as RpcException).getError()).toEqual({
        code: 5,
        message: `Файл с ID: ${mockFileUserId.fileId} не найден`,
      });

      expect(mockRepo.deleteFile).toHaveBeenCalledWith(mockFileUserId);
      expect(unlinkSpy).not.toHaveBeenCalled();
    } finally {
      unlinkSpy.mockRestore();
    }
  });

  it(`deleteFile выбрасывает RpcException с кодом 5, если файл не найден`, async () => {
    mockRepo.getFile.mockResolvedValue(null);

    const unlinkSpy = jest.spyOn(fs.promises, 'unlink');

    let caughtError: unknown;

    try {
      await service.deleteFile(mockFileUserId);
    } catch (err: unknown) {
      caughtError = err;
    } finally {
      unlinkSpy.mockRestore();
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 5,
      message: 'Файл не найден',
    });

    expect(mockRepo.getFile).toHaveBeenCalledWith(mockFileUserId.fileId);
    expect(mockRepo.deleteFile).not.toHaveBeenCalled();
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it(`deleteFile выбрасывает RpcException с кодом 5, если файл принадлежит другому пользователю`, async () => {
    mockRepo.getFile.mockResolvedValue({
      fileId: mockFileUserId.fileId,
      userId: 'другой пользователь',
    } as FileEntity);

    const unlinkSpy = jest.spyOn(fs.promises, 'unlink');

    let caughtError: unknown;

    try {
      await service.deleteFile(mockFileUserId);
    } catch (err: unknown) {
      caughtError = err;
    } finally {
      unlinkSpy.mockRestore();
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 5,
      message: 'Файл не найден',
    });

    expect(mockRepo.getFile).toHaveBeenCalledWith(mockFileUserId.fileId);
    expect(mockRepo.deleteFile).not.toHaveBeenCalled();
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it(`downloadFile успешно отдаёт файл`, async () => {
    mockRepo.downloadFileVerifyUser.mockResolvedValue({
      fileId: mockFileUserId.fileId,
      uploadedAt: new Date('2026-09-01T12:00:00.000Z'),
    } as FileEntity);

    const stream = Readable.from([Buffer.from('hello')]);

    const readStreamSpy = jest
      .spyOn(fs, 'createReadStream')
      .mockReturnValue(stream as fs.ReadStream);

    try {
      const result$ = await service.downloadFile(mockFileUserId);
      const result = await lastValueFrom(result$);

      expect(result).toEqual({
        chunk: Buffer.from('hello'),
      });

      expect(mockRepo.downloadFileVerifyUser).toHaveBeenCalledWith(
        mockFileUserId,
      );
      expect(readStreamSpy).toHaveBeenCalled();
    } finally {
      readStreamSpy.mockRestore();
    }
  });

  it('downloadFile отправляет metadata только в первом сообщении', async () => {
    const file = {
      fileId: mockFileUserId.fileId,
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
      size: 5,
      taskId: 'task-id',
      userId: mockFileUserId.userId,
      uploadedAt: new Date('2026-08-26T00:00:00.000Z'),
    };
    mockRepo.downloadFileVerifyUser.mockResolvedValue(file);

    const readStreamSpy = jest
      .spyOn(fs, 'createReadStream')
      .mockReturnValue(Readable.from([Buffer.from('hello')]) as fs.ReadStream);

    try {
      const result$ = await service.downloadFile(mockFileUserId);
      const messages = await lastValueFrom(result$.pipe(toArray()));

      expect(messages).toEqual([
        {
          chunk: new Uint8Array(),
          metadata: {
            fileId: file.fileId,
            fileName: file.fileName,
            mimeType: file.mimeType,
            size: file.size,
            taskId: file.taskId,
            uploadedAt: '2026-08-26T00:00:00.000Z',
          },
        },
        { chunk: Buffer.from('hello'), metadata: undefined },
      ]);
      expect(mockRepo.downloadFileVerifyUser).toHaveBeenCalledWith(
        mockFileUserId,
      );
      expect(readStreamSpy).toHaveBeenCalledWith(
        expect.stringContaining(mockFileUserId.fileId),
      );
    } finally {
      readStreamSpy.mockRestore();
    }
  });

  it(`downloadFile пробрасывает ошибку репозитория`, async () => {
    const error = new RpcException({
      code: 5,
      message: 'Файл не найден',
    });

    mockRepo.downloadFileVerifyUser.mockRejectedValue(error);
    try {
      await service.downloadFile(mockFileUserId);
    } catch (err) {
      expect(err).toBe(error);
      expect(err).toBeInstanceOf(RpcException);
    }
  });

  it('downloadFile возвращает ошибку 5, если файла нет на диске', async () => {
    mockRepo.downloadFileVerifyUser.mockResolvedValue({
      fileId: mockFileUserId.fileId,
      uploadedAt: new Date('2026-09-01T12:00:00.000Z'),
    } as FileEntity);

    const stream = new Readable({
      read() {
        const error = Object.assign(new Error('Файл не найден'), {
          code: 'ENOENT',
        });

        this.destroy(error);
      },
    });

    const readStreamSpy = jest
      .spyOn(fs, 'createReadStream')
      .mockReturnValue(stream as fs.ReadStream);

    try {
      const result$ = await service.downloadFile(mockFileUserId);

      try {
        await lastValueFrom(result$);
      } catch (err) {
        expect(err).toBeInstanceOf(RpcException);
        expect((err as RpcException).getError()).toEqual({
          code: 5,
          message: 'Файл не найден',
        });

        expect(mockRepo.downloadFileVerifyUser).toHaveBeenCalledWith(
          mockFileUserId,
        );
        expect(readStreamSpy).toHaveBeenCalled();
      }
    } finally {
      readStreamSpy.mockRestore();
    }
  });

  it(`downloadFile возвращает RpcException с кодом 5, если репозиторий не нашёл файл`, async () => {
    mockRepo.downloadFileVerifyUser.mockResolvedValue(null);

    const readStreamSpy = jest.spyOn(fs, 'createReadStream');

    let caughtError: unknown;

    try {
      await service.downloadFile(mockFileUserId);
    } catch (err: unknown) {
      caughtError = err;
    } finally {
      readStreamSpy.mockRestore();
    }

    expect(caughtError).toBeInstanceOf(RpcException);
    expect((caughtError as RpcException).getError()).toEqual({
      code: 5,
      message: 'Файл не найден',
    });

    expect(mockRepo.downloadFileVerifyUser).toHaveBeenCalledWith(
      mockFileUserId,
    );
    expect(readStreamSpy).not.toHaveBeenCalled();
  });
});

let service: FilesService;
