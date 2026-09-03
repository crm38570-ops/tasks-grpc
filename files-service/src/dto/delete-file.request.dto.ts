import { IsString, IsUUID } from 'class-validator';

export class DeleteFileRequestDto {
  @IsString()
  @IsUUID('4')
  fileId: string;

  @IsString()
  @IsUUID('4')
  userId: string;

  @IsString()
  @IsUUID('4')
  taskId: string;
}
