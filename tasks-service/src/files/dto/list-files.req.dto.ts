import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ListFilesReqDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Идентификатор задачи в формате UUID v4',
  })
  @IsString()
  @IsUUID(4)
  taskId: string;
}
