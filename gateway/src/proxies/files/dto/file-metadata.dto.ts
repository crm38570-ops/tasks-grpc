import { ApiProperty } from '@nestjs/swagger';

export class FileMetadataDto {
  @ApiProperty({
    format: 'uuid',
    description: 'UUID файла',
  })
  fileId: string;

  @ApiProperty({
    description: 'Имя файла',
    example: 'report.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'MIME-тип файла',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Размер файла в байтах',
    example: 10240,
  })
  size: number;

  @ApiProperty({
    format: 'uuid',
    description: 'UUID задачи',
  })
  taskId: string;

  @ApiProperty({
    description: 'Дата загрузки (ISO 8601)',
    example: '2026-09-04T12:00:00.000Z',
  })
  uploadedAt: string;
}

export class FilesListResponseDto {
  @ApiProperty({
    type: [FileMetadataDto],
    description: 'Список файлов задачи',
  })
  files: FileMetadataDto[];
}

export class UploadFileResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'UUID загруженного файла',
  })
  fileId: string;
}
