import { IsString, IsUUID } from 'class-validator';

export class DownloadFileReqDto {
  @IsString()
  @IsUUID(4)
  fileId: string;

  @IsString()
  @IsUUID(4)
  taskId: string;
}
