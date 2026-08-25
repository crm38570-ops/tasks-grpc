import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import {
  FileMetadata,
  UploadFileRequestDto,
} from '../dto/upload-file.request.dto';

describe(`UploadFileRequestDto`, () => {
  const collect = (errors: ValidationError[]): string[] =>
    errors.flatMap((error) => [
      ...Object.values(error.constraints ?? {}),
      ...(error.children?.length ? collect(error.children) : []),
    ]);

  it(`Валидирует корректный запрос без ошибок`, async () => {
    const dto = plainToInstance(UploadFileRequestDto, validPayload);

    expect(dto.metadata).toBeInstanceOf(FileMetadata);
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it(`Возвращает isDefined, если content отсутствует`, async () => {
    const errors = await validate(
      plainToInstance(UploadFileRequestDto, {
        metadata: validPayload.metadata,
      }),
    );

    expect(collect(errors)).toContain(
      'content should not be null or undefined',
    );
  });

  it(`Возвращает isDefined, если metadata отсутствует`, async () => {
    const errors = await validate(
      plainToInstance(UploadFileRequestDto, {
        content: validPayload.content,
      }),
    );

    expect(collect(errors)).toContain(
      'metadata should not be null or undefined',
    );
  });

  it(`Возвращает ошибку строки для некорректного fileName`, async () => {
    const errors = await validate(
      plainToInstance(UploadFileRequestDto, {
        ...validPayload,
        metadata: { ...validPayload.metadata, fileName: 123 },
      }),
    );

    expect(collect(errors)).toContain('fileName must be a string');
  });

  it(`Возвращает ошибку MIME-типа для некорректного mimeType`, async () => {
    const errors = await validate(
      plainToInstance(UploadFileRequestDto, {
        ...validPayload,
        metadata: { ...validPayload.metadata, mimeType: 'не пойми что' },
      }),
    );

    expect(collect(errors)).toContain('mimeType must be MIME type format');
  });

  it(`Возвращает ошибку min для нулевого size`, async () => {
    const errors = await validate(
      plainToInstance(UploadFileRequestDto, {
        ...validPayload,
        metadata: { ...validPayload.metadata, size: 0 },
      }),
    );

    expect(collect(errors)).toContain('size must not be less than 1');
  });

  it(`Возвращает ошибку UUID для некорректного taskId`, async () => {
    const errors = await validate(
      plainToInstance(UploadFileRequestDto, {
        ...validPayload,
        metadata: { ...validPayload.metadata, taskId: 'not-a-uuid' },
      }),
    );

    expect(collect(errors)).toContain('taskId must be a UUID');
  });

  it(`Возвращает ошибку UUID для некорректного userId`, async () => {
    const errors = await validate(
      plainToInstance(UploadFileRequestDto, {
        ...validPayload,
        metadata: { ...validPayload.metadata, userId: 'not-a-uuid' },
      }),
    );

    expect(collect(errors)).toContain('userId must be a UUID');
  });

  it(`Отклоняет UUID другой версии`, async () => {
    const errors = await validate(
      plainToInstance(UploadFileRequestDto, {
        ...validPayload,
        metadata: {
          ...validPayload.metadata,
          taskId: '550e8400-e29b-11d4-a716-446655440000',
        },
      }),
    );

    expect(collect(errors)).toContain('taskId must be a UUID');
  });
});

const validPayload = {
  content: new Uint8Array([1, 2, 3]),
  metadata: {
    fileName: 'file.txt',
    mimeType: 'text/plain',
    size: 12,
    taskId: '550e8400-e29b-41d4-a716-446655440000',
    userId: '550e8400-e29b-41d4-a716-446655440001',
  },
};
