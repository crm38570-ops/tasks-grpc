import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class FileIdParamDto {
  @IsString()
  @IsUUID('4')
  @ApiProperty({
    format: 'uuid',
    description: 'UUID файла',
  })
  fileId: string;
}
