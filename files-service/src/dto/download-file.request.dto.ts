import { IsString, IsUUID } from 'class-validator';

export class DownloadFileRequestDto {
  @IsString()
  @IsUUID('4')
  fileId: string;

  @IsString()
  @IsUUID('4')
  userId: string;
}
