import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsMimeType,
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

  @IsInt()
  @Min(0)
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
