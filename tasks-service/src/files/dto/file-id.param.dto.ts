import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FileIdParamDto {
  @ApiProperty({
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Идентификатор файла в формате UUID v4',
  })
  @IsUUID('4')
  fileId: string;
}
