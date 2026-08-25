import { IsString, IsUUID } from 'class-validator';

export class ListFilesRequestDto {
  @IsString()
  @IsUUID('4')
  taskId: string;

  @IsString()
  @IsUUID('4')
  userId: string;
}
