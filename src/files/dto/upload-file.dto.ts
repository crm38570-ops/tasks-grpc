import { IsString, IsNumber, IsUUID } from 'class-validator';

export class UploadFileDto {
  content: Uint8Array<ArrayBuffer | SharedArrayBuffer>;
  metadata: Metadata;
}

class Metadata {
  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsString()
  @IsUUID(4)
  taskId: string;
}
