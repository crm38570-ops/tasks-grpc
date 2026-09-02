import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsUUID('4')
  @ApiProperty({
    format: 'uuid',
    description: 'UUID задачи',
  })
  taskId: string;
}
