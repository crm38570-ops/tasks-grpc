import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class DownloadFileReqDto {
  @ApiProperty({
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Идентификатор файла в формате UUID v4',
  })
  @IsString()
  @IsUUID(4)
  fileId: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Идентификатор задачи в формате UUID v4',
  })
  @IsString()
  @IsUUID(4)
  taskId: string;
}
