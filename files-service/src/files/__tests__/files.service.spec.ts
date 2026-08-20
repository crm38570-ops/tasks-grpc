import {
  describe,
  it,
  jest,
  beforeAll,
  beforeEach,
  afterAll,
  expect,
} from '@jest/globals';
import { FilesService } from '../files.controller';
import { FilesRepository } from '../files.repository';
import {
  DeleteFileRequest,
  DownloadFileRequest,
  FileMetadataRequest,
  FileMetadataResponse,
  ListFilesRequest,
  UploadFileResponse,
} from '../../proto/files/generated/files_service';
import { RpcException } from '@nestjs/microservices';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { lastValueFrom } from 'rxjs';
import { mockFileUserId, mockTaskUserId } from './variables';
import { Logger } from '@nestjs/common';

describe('FilesService', () => {
  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.FILE_DIR = './storage';
    service = new FilesService(mockRepo as unknown as FilesRepository);
  });

  const mockRepo = {
    saveFile:
      jest.fn<(metadata: FileMetadataRequest) => Promise<UploadFileResponse>>(),
    getListFiles:
      jest.fn<
        (listFilesRequest: ListFilesRequest) => Promise<FileMetadataResponse[]>
      >(),
    deleteFile:
      jest.fn<(deleteFileRequest: DeleteFileRequest) => Promise<void>>(),
    downloadFileVerifyUser:
      jest.fn<(downloadFileRequest: DownloadFileRequest) => Promise<void>>(),
  };

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

  it(`getListFiles возвращает RpcException с кодом 5, если для задачи нет файлов`, async () => {
    mockRepo.getListFiles.mockResolvedValue([] as FileMetadataResponse[]);

    await expect(service.getListFiles(mockTaskUserId)).rejects.toThrow({
      code: 5,
      message: `Для данной задачи нет подходящих файлов`,
    });

    expect(mockRepo.getListFiles).toHaveBeenCalledWith(mockTaskUserId);
  });

  it('deleteFile успешно удаляет файл', async () => {
    const unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);

    try {
      await expect(service.deleteFile(mockFileUserId)).resolves.toBeUndefined();

      expect(mockRepo.deleteFile).toHaveBeenCalledWith(mockFileUserId);
      expect(unlinkSpy).toHaveBeenCalled();
    } finally {
      unlinkSpy.mockRestore();
    }
  });

  it('deleteFile пробрасывает RpcException с кодом 5', async () => {
    const error = new RpcException({
      code: 5,
      message: 'Файл не найден',
    });

    mockRepo.deleteFile.mockRejectedValue(error);

    let caughtError: unknown;

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

    expect(mockRepo.deleteFile).toHaveBeenCalledWith(mockFileUserId);
  });

  it(`deleteFile выбрасывает ошибку RpcException, если файл с кодом 13, если файла нет`, async () => {
    const error = new Error('Ошибка');
    const expectedErr = {
      code: 13,
      message: 'Ошибка удаления файла',
    };

    mockRepo.deleteFile.mockRejectedValue(error);

    try {
      await service.deleteFile(mockFileUserId);
    } catch (err) {
      expect(err).toBeInstanceOf(RpcException);
      expect((err as RpcException).getError()).toEqual(expectedErr);
    }
  });

  it(`downloadFile успешно отдаёт файл`, async () => {
    mockRepo.downloadFileVerifyUser.mockResolvedValue(undefined);

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

  it(`downloadFile успешно отдаёт файл`, async () => {
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
    mockRepo.downloadFileVerifyUser.mockResolvedValue(undefined);

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
});

let service: FilesService;
