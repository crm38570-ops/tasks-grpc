import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { APP_FILTER } from '@nestjs/core';
import { Global, Module } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { Logger, type INestApplication } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util.js';
import { from, lastValueFrom, toArray } from 'rxjs';
import { status } from '@grpc/grpc-js';
import * as classValidator from 'class-validator';
import * as classTransformer from 'class-transformer';
import * as grpcJs from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { FilesModule } from '../src/files/files.module';
import { FilesRepository } from '../src/files/files.repository';
import { GrpcExceptionFilter } from '../src/common/filters/grpc-exception.filter';
import { configValidationSchema } from '../src/config.schema';
import { FileEntity } from '../src/files/file.entity';
import type {
  FilesServiceClient,
  UploadFileRequest,
} from '../src/proto/files/generated/files_service';

const TASK_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const SERVER_URL = '127.0.0.1:50101';

const metadata = {
  fileName: 'cat.png',
  mimeType: 'image/png',
  taskId: TASK_ID,
  userId: USER_ID,
};

interface GrpcClientError {
  code: number;
  message: string;
}

const captureError = async (
  promise: Promise<unknown>,
): Promise<GrpcClientError | null> => {
  try {
    await promise;
    return null;
  } catch (err) {
    return err as GrpcClientError;
  }
};

@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useValue: {
        createEntityManager: () => ({}),
        entityMetadatas: [],
        options: { type: 'postgres' },
        getRepository: () => ({}),
      },
    },
  ],
  exports: [DataSource],
})
class MockTypeOrmModule {}

describe('FilesService e2e (gRPC)', () => {
  let tempDir: string;
  let clientProxy: ClientProxy;
  let client: ClientGrpc;
  let app: INestApplication;
  let filesService: FilesServiceClient;

  const mockRepo = {
    saveFile: jest.fn<(file: Partial<FileEntity>) => Promise<FileEntity>>(),
    getFile: jest.fn<(fileId: string) => Promise<FileEntity | null>>(),
    getListFiles: jest.fn<() => Promise<FileEntity[]>>(),
    deleteFile: jest.fn<() => Promise<{ affected: number | null }>>(),
    downloadFileVerifyUser: jest.fn<() => Promise<FileEntity | null>>(),
  };

  const validateTaskOwner =
    jest.fn<
      (req: { taskId: string; userId: string }) => Promise<{ isOwner: boolean }>
    >();

  beforeAll(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);

    tempDir = await mkdtemp(join(tmpdir(), 'files-e2e-'));

    await loadPackage('class-validator', 'ValidationPipe', () =>
      Promise.resolve(classValidator),
    );
    await loadPackage('class-transformer', 'ValidationPipe', () =>
      Promise.resolve(classTransformer),
    );
    await loadPackage('@grpc/grpc-js', 'gRPC transport', () =>
      Promise.resolve(grpcJs),
    );
    await loadPackage('@grpc/proto-loader', 'gRPC transport', () =>
      Promise.resolve(protoLoader),
    );

    Object.assign(process.env, {
      STAGE: 'dev',
      GRPC_PORT: '50101',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USERNAME: 'postgres',
      DB_PASSWORD: 'postgres',
      DB_DATABASE: 'files-service-test',
      FILE_DIR: tempDir,
      MAX_UPLOAD_SIZE: '1024',
      TASKS_GRPC_URL: '127.0.0.1:50102',
      TASKS_GRPC_TIMEOUT_MS: '1000',
    });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validationSchema: configValidationSchema,
        }),
        MockTypeOrmModule,
        FilesModule,
      ],
      providers: [{ provide: APP_FILTER, useClass: GrpcExceptionFilter }],
    })
      .overrideProvider(FilesRepository)
      .useValue(mockRepo)
      .overrideProvider('TASKS_INTERNAL_GRPC_CLIENT')
      .useValue({
        getService: () => ({
          validateTaskOwner: (req: { taskId: string; userId: string }) =>
            from(validateTaskOwner(req)),
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();

    app.connectMicroservice(
      {
        transport: Transport.GRPC,
        options: {
          package: 'files',
          protoPath: join(
            __dirname,
            '..',
            'src',
            'proto',
            'files',
            'files_service.proto',
          ),
          url: SERVER_URL,
          loader: { longs: Number },
        },
      },
      { inheritAppConfig: true },
    );

    await app.init();
    await app.startAllMicroservices();

    clientProxy = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'files',
        protoPath: join(
          __dirname,
          '..',
          'src',
          'proto',
          'files',
          'files_service.proto',
        ),
        url: SERVER_URL,
        loader: { longs: Number },
      },
    });

    client = clientProxy as unknown as ClientGrpc;

    filesService = client.getService<FilesServiceClient>('FilesService');
  });

  afterAll(async () => {
    await app.close();
    clientProxy.close();
    await rm(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    validateTaskOwner.mockResolvedValue({ isOwner: true });
  });

  it('uploadFile сохраняет файл и возвращает fileId', async () => {
    mockRepo.saveFile.mockResolvedValue({} as FileEntity);

    const messages: UploadFileRequest[] = [
      { content: new Uint8Array(0), metadata },
      { content: new Uint8Array([1, 2, 3]), metadata: undefined },
    ];

    const response = await lastValueFrom(
      filesService.uploadFile(from(messages)),
    );

    expect(response.fileId).toEqual(expect.any(String));
    expect(validateTaskOwner).toHaveBeenCalledWith({
      taskId: TASK_ID,
      userId: USER_ID,
    });
    expect(mockRepo.saveFile).toHaveBeenCalledWith(
      expect.objectContaining({ ...metadata, size: 3 }),
    );

    const stored = await readFile(join(tempDir, response.fileId));
    expect(stored).toEqual(Buffer.from([1, 2, 3]));
  });

  it('uploadFile с пустым потоком возвращает INVALID_ARGUMENT(3)', async () => {
    const err = await captureError(
      lastValueFrom(filesService.uploadFile(from([]))),
    );

    expect(err.code).toBe(status.INVALID_ARGUMENT);
    expect(err.message).toContain('Пустой поток');
    expect(mockRepo.saveFile).not.toHaveBeenCalled();
  });

  it('uploadFile с превышением размера возвращает INVALID_ARGUMENT(3)', async () => {
    const err = await captureError(
      lastValueFrom(
        filesService.uploadFile(
          from<UploadFileRequest>([
            {
              content: new Uint8Array(2048),
              metadata,
            },
          ]),
        ),
      ),
    );

    expect(err.code).toBe(status.INVALID_ARGUMENT);
    expect(err.message).toContain('content пустой или превышает');
    expect(mockRepo.saveFile).not.toHaveBeenCalled();
  });

  it('uploadFile с невалидными метаданными возвращает INVALID_ARGUMENT(3)', async () => {
    const err = await captureError(
      lastValueFrom(
        filesService.uploadFile(
          from<UploadFileRequest>([
            {
              content: new Uint8Array([1]),
              metadata: { ...metadata, taskId: 'not-a-uuid' },
            },
          ]),
        ),
      ),
    );

    expect(err.code).toBe(status.INVALID_ARGUMENT);
    expect(mockRepo.saveFile).not.toHaveBeenCalled();
  });

  it('uploadFile для чужой задачи возвращает PERMISSION_DENIED(7)', async () => {
    validateTaskOwner.mockResolvedValue({ isOwner: false });

    const err = await captureError(
      lastValueFrom(
        filesService.uploadFile(
          from<UploadFileRequest>([{ content: new Uint8Array([1]), metadata }]),
        ),
      ),
    );

    expect(err.code).toBe(status.PERMISSION_DENIED);
    expect(err.message).toContain('Задача не найдена или недоступна');
    expect(mockRepo.saveFile).not.toHaveBeenCalled();
  });

  it('downloadFile отдаёт metadata и содержимое файла', async () => {
    const fileId = '33333333-3333-4333-8333-333333333333';
    const fileContent = Buffer.from('hello world');

    await writeFile(join(tempDir, fileId), fileContent);
    mockRepo.downloadFileVerifyUser.mockResolvedValue({
      fileId,
      fileName: 'cat.png',
      mimeType: 'image/png',
      size: fileContent.length,
      taskId: TASK_ID,
      userId: USER_ID,
      uploadedAt: new Date('2026-09-01T12:00:00.000Z'),
    });

    const messages = await lastValueFrom(
      filesService.downloadFile({ fileId, userId: USER_ID }).pipe(toArray()),
    );

    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({
      chunk: new Uint8Array(0),
      metadata: {
        fileId,
        fileName: 'cat.png',
        mimeType: 'image/png',
        size: fileContent.length,
        taskId: TASK_ID,
        uploadedAt: '2026-09-01T12:00:00.000Z',
      },
    });

    const chunks = messages
      .slice(1)
      .map((message: { chunk: Uint8Array }) => Buffer.from(message.chunk));

    expect(Buffer.concat(chunks)).toEqual(fileContent);
  });

  it('downloadFile отсутствующего файла возвращает NOT_FOUND(5)', async () => {
    mockRepo.downloadFileVerifyUser.mockResolvedValue(null);

    const err = await captureError(
      lastValueFrom(
        filesService.downloadFile({
          fileId: '33333333-3333-4333-8333-333333333333',
          userId: USER_ID,
        }),
      ),
    );

    expect(err.code).toBe(status.NOT_FOUND);
    expect(err.message).toContain('Файл не найден');
  });

  it('downloadFile с невалидным fileId возвращает INVALID_ARGUMENT(3)', async () => {
    const err = await captureError(
      lastValueFrom(
        filesService.downloadFile({ fileId: 'not-a-uuid', userId: USER_ID }),
      ),
    );

    expect(err.code).toBe(status.INVALID_ARGUMENT);
    expect(mockRepo.downloadFileVerifyUser).not.toHaveBeenCalled();
  });

  it('listFiles возвращает файлы задачи', async () => {
    mockRepo.getListFiles.mockResolvedValue([
      {
        fileId: '44444444-4444-4444-8444-444444444444',
        fileName: 'cat.png',
        mimeType: 'image/png',
        size: 3,
        taskId: TASK_ID,
        uploadedAt: '2026-09-01T12:00:00.000Z',
      } as unknown as FileEntity,
    ]);

    const response = await lastValueFrom(
      filesService.listFiles({ taskId: TASK_ID, userId: USER_ID }),
    );

    expect(mockRepo.getListFiles).toHaveBeenCalledWith({
      taskId: TASK_ID,
      userId: USER_ID,
    });
    expect(response.files).toHaveLength(1);
    expect(response.files[0]).toEqual({
      fileId: '44444444-4444-4444-8444-444444444444',
      fileName: 'cat.png',
      mimeType: 'image/png',
      size: 3,
      taskId: TASK_ID,
      uploadedAt: '2026-09-01T12:00:00.000Z',
    });
  });

  it('deleteFile удаляет запись и файл с диска', async () => {
    const fileId = '55555555-5555-4555-8555-555555555555';

    await writeFile(join(tempDir, fileId), Buffer.from([1]));

    mockRepo.getFile.mockResolvedValue({
      fileId,
      taskId: TASK_ID,
      userId: USER_ID,
    } as FileEntity);
    mockRepo.deleteFile.mockResolvedValue({ affected: 1 });

    await lastValueFrom(
      filesService.deleteFile({ fileId, taskId: TASK_ID, userId: USER_ID }),
    );

    expect(mockRepo.deleteFile).toHaveBeenCalledWith({
      fileId,
      taskId: TASK_ID,
      userId: USER_ID,
    });

    await expect(readFile(join(tempDir, fileId))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('deleteFile отсутствующей записи возвращает NOT_FOUND(5)', async () => {
    const fileId = '55555555-5555-4555-8555-555555555555';

    mockRepo.getFile.mockResolvedValue({
      fileId,
      taskId: TASK_ID,
      userId: USER_ID,
    } as FileEntity);
    mockRepo.deleteFile.mockResolvedValue({ affected: 0 });

    const err = await captureError(
      lastValueFrom(
        filesService.deleteFile({ fileId, taskId: TASK_ID, userId: USER_ID }),
      ),
    );

    expect(err.code).toBe(status.NOT_FOUND);
    expect(err.message).toContain(`Файл с ID: ${fileId} не найден`);
  });
});
