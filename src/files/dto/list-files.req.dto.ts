import { IsString, IsUUID } from 'class-validator';

export class ListFilesReqDto {
  @IsString()
  @IsUUID(4)
  taskId: string;
}
