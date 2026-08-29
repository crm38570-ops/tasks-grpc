import { IsUUID } from 'class-validator';

export class UploadFileDto {
  @IsUUID('4')
  taskId: string;
}
