import { describe, it, jest, beforeEach, expect } from '@jest/globals';
import { FilesService } from '../files.service';
import { FilesRepository } from '../files.repository';
import {
  FileMetadata,
  FileMetadataExtended,
  ListFilesResponse,
  UploadFileResponse,
} from '../../proto/files/generated/files_service';

describe('FilesService', () => {
  let service: FilesService;

  const mockRepo = {
    saveFile:
      jest.fn<(metadata: FileMetadata) => Promise<UploadFileResponse>>(),
    getListFiles: jest.fn<(taskId: string) => Promise<ListFilesResponse>>(),
    deleteFile: jest.fn<(fileId: string) => Promise<void>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.FILE_DIR = './storage';
    service = new FilesService(mockRepo as unknown as FilesRepository);
  });

  it('getListFiles() возвращает файлы, которые нашёл репозиторий', async () => {
    const file: FileMetadataExtended = {
      fileId: 'id-1',
      fileName: 'cat.png',
      mimeType: 'image/png',
      size: 100,
      taskId: 'task-1',
      uploadedAt: new Date(Date.now()),
    };

    mockRepo.getListFiles.mockResolvedValue([
      file,
    ] as unknown as ListFilesResponse);

    const result = await service.getListFiles({ taskId: 'id-1' });

    expect(mockRepo.getListFiles).toHaveBeenCalledWith('id-1');
    expect(result).toEqual({ files: [file] });
  });

  it(`Возвращает NotFoundException, если для задачи нет файлов`, async () => {
    mockRepo.getListFiles.mockResolvedValue([] as unknown as ListFilesResponse);

    await expect(service.getListFiles({ taskId: 'id-1' })).rejects.toThrow(
      'Для данной задачи нет подходящих файлов',
    );

    expect(mockRepo.getListFiles).toHaveBeenCalledWith('id-1');
  });
});
