import { IsString, IsUUID } from 'class-validator';

export class DeleteFileReqDto {
  @IsString()
  @IsUUID(4)
  fileId: string;

  @IsString()
  @IsUUID(4)
  taskId: string;
}
