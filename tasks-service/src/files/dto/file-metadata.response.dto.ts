import { ApiProperty } from '@nestjs/swagger';

export class FileMetadataResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Идентификатор файла в формате UUID v4',
  })
  fileId: string;

  @ApiProperty({ example: 'hello.txt', description: 'Имя файла' })
  fileName: string;

  @ApiProperty({ example: 'text/plain', description: 'MIME-тип файла' })
  mimeType: string;

  @ApiProperty({ example: 5, description: 'Размер файла в байтах' })
  size: number;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Идентификатор задачи в формате UUID v4',
  })
  taskId: string;

  @ApiProperty({
    example: '2026-08-18T12:00:00.000Z',
    description: 'Дата и время загрузки файла в формате ISO 8601',
    format: 'date-time',
  })
  uploadedAt: string;
}
