import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID } from 'class-validator';

export class UploadFileDto {
  @ApiProperty({
    type: [Number],
    example: [72, 101, 108, 108, 111],
    description:
      'Временный формат: содержимое файла в виде массива байтов. Multipart-загрузка будет добавлена позже.',
  })
  content: Uint8Array<ArrayBuffer | SharedArrayBuffer>;

  @ApiProperty({ type: () => Metadata })
  metadata: Metadata;
}

export class Metadata {
  @ApiProperty({ example: 'hello.txt', description: 'Имя файла' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'text/plain', description: 'MIME-тип файла' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 5, description: 'Размер файла в байтах' })
  @IsNumber()
  size: number;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Идентификатор задачи в формате UUID v4',
  })
  @IsString()
  @IsUUID(4)
  taskId: string;
}
