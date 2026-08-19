import { ApiProperty } from '@nestjs/swagger';
import { FileMetadataResponseDto } from './file-metadata.response.dto';

export class ListFilesResponseDto {
  @ApiProperty({
    type: () => [FileMetadataResponseDto],
    description: 'Файлы, принадлежащие указанной задаче и пользователю',
  })
  files: FileMetadataResponseDto[];
}
