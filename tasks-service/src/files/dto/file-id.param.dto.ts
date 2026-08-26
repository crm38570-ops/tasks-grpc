import { IsUUID } from 'class-validator';

export class FileIdParamDto {
  @IsUUID('4')
  fileId: string;
}
