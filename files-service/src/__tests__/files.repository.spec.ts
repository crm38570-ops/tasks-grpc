import { describe, it, jest, expect, beforeEach } from '@jest/globals';
import { FilesRepository } from '../files/files.repository';
import { DataSource } from 'typeorm';
import { mockFileUserId, mockTaskUserId } from './variables';
import { FileEntity } from '../files/file.entity';
import { FileMetadataRequest } from '../proto/files/generated/files_service';
import { RpcException } from '@nestjs/microservices';

describe(`FilesRepository`, () => {
  const mockDataSource = {
    createEntityManager: jest.fn().mockReturnValue({}),
  } as unknown as DataSource;

  let repository: FilesRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    repository = new FilesRepository(mockDataSource);
  });

  const fileMetadataRequest: FileMetadataRequest = {
    fileName: 'file.txt',
    mimeType: 'text/plain',
    size: 12,
    ...mockTaskUserId,
  };

  const fileMetadataRequestWithId = {
    ...fileMetadataRequest,
    fileId: 'file-id',
  };

  it('saveFile сохраняет метаданные файла', async () => {
    const entity = { ...fileMetadataRequestWithId } as FileEntity;
    const createSpy = jest.spyOn(repository, 'create').mockReturnValue(entity);
    const saveSpy = jest.spyOn(repository, 'save').mockResolvedValue(entity);

    await expect(
      repository.saveFile(fileMetadataRequestWithId),
    ).resolves.toEqual(entity);

    expect(createSpy).toHaveBeenCalledWith(fileMetadataRequestWithId);
    expect(saveSpy).toHaveBeenCalledWith(entity);
  });

  it('saveFile пробрасывает RpcException из save', async () => {
    const error = new RpcException({ code: 5, message: 'Файл не найден' });
    jest
      .spyOn(repository, 'create')
      .mockReturnValue(fileMetadataRequestWithId as FileEntity);
    jest.spyOn(repository, 'save').mockRejectedValue(error);

    await expect(repository.saveFile(fileMetadataRequestWithId)).rejects.toBe(
      error,
    );
  });

  it('saveFile пробрасывает неизвестную ошибку как есть', async () => {
    const error = new Error('Ошибка базы данных');
    jest
      .spyOn(repository, 'create')
      .mockReturnValue(fileMetadataRequestWithId as FileEntity);
    jest.spyOn(repository, 'save').mockRejectedValue(error);

    await expect(repository.saveFile(fileMetadataRequestWithId)).rejects.toBe(
      error,
    );
  });

  it('getFile возвращает файл по fileId', async () => {
    const getOne = jest
      .fn()
      .mockResolvedValue({ fileId: mockFileUserId.fileId } as never);
    const where = jest.fn().mockReturnValue({ getOne });

    jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
      where,
    });

    await expect(repository.getFile(mockFileUserId.fileId)).resolves.toEqual({
      fileId: mockFileUserId.fileId,
    });

    expect(where).toHaveBeenCalledWith({ fileId: mockFileUserId.fileId });
    expect(getOne).toHaveBeenCalled();
  });

  it('getFile возвращает null, если файл не найден', async () => {
    const getOne = jest.fn().mockResolvedValue(null as never);
    const where = jest.fn().mockReturnValue({ getOne });

    jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
      where,
    });

    await expect(repository.getFile(mockFileUserId.fileId)).resolves.toBeNull();

    expect(where).toHaveBeenCalledWith({ fileId: mockFileUserId.fileId });
    expect(getOne).toHaveBeenCalled();
  });

  it(`getListFiles фильтрует файлы по taskId и userId`, async () => {
    const files = [
      {
        ...mockFileUserId,
        ...mockTaskUserId,
      } as FileEntity,
    ];

    const getMany = jest.fn().mockResolvedValue(files as never);
    const where = jest.fn().mockReturnValue({
      getMany,
    });

    jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
      where,
    });

    const result = await repository.getListFiles(mockTaskUserId);

    expect(result).toEqual(files);
    expect(where).toHaveBeenCalledWith(mockTaskUserId);
    expect(getMany).toHaveBeenCalled();
  });

  it('deleteFile удаляет файл по fileId и userId', async () => {
    const deleteSpy = jest.spyOn(repository, 'delete').mockResolvedValue({
      affected: 1,
    });

    await expect(repository.deleteFile(mockFileUserId)).resolves.toEqual({
      affected: 1,
    });

    expect(deleteSpy).toHaveBeenCalledWith(mockFileUserId);
  });

  it('deleteFile возвращает affected: 0, если файл не найден', async () => {
    const deleteSpy = jest.spyOn(repository, 'delete').mockResolvedValue({
      affected: 0,
    });

    await expect(repository.deleteFile(mockFileUserId)).resolves.toEqual({
      affected: 0,
    });

    expect(deleteSpy).toHaveBeenCalledWith(mockFileUserId);
  });

  it('downloadFileVerifyUser завершается успешно для владельца файла', async () => {
    const getOne = jest
      .fn()
      .mockResolvedValue({ fileId: mockFileUserId.fileId } as never);
    const where = jest.fn().mockReturnValue({ getOne });

    jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
      where,
    });

    await expect(
      repository.downloadFileVerifyUser(mockFileUserId),
    ).resolves.toEqual({ fileId: mockFileUserId.fileId });

    expect(where).toHaveBeenCalledWith(mockFileUserId);
    expect(getOne).toHaveBeenCalled();
  });

  it('downloadFileVerifyUser возвращает null, если файл не найден', async () => {
    const getOne = jest.fn().mockResolvedValue(null as never);
    const where = jest.fn().mockReturnValue({ getOne });

    jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
      where,
    });

    await expect(
      repository.downloadFileVerifyUser(mockFileUserId),
    ).resolves.toBeNull();

    expect(where).toHaveBeenCalledWith(mockFileUserId);
  });
});
