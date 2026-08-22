import { Type } from 'class-transformer';
import {
  IsDefined,
  IsMimeType,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class FileMetadata {
  @IsString()
  fileName: string;

  @IsString()
  @IsMimeType()
  mimeType: string;

  @IsNumber()
  @Min(1)
  size: number;

  @IsString()
  @IsUUID('4')
  taskId: string;

  @IsString()
  @IsUUID('4')
  userId: string;
}

export class UploadFileRequestDto {
  @IsDefined()
  content: Uint8Array<ArrayBufferLike>;

  @IsDefined()
  @ValidateNested()
  @Type(() => FileMetadata)
  metadata: FileMetadata;
}
