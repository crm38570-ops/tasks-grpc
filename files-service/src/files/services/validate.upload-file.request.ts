import { plainToInstance } from 'class-transformer';
import { UploadFileRequestDto } from '../dto/upload-file.request.dto';
import { validateSync } from 'class-validator';
import { errorsMapper } from './errors.mapper';

export const validateUploadFileRequest = (
  uploadFileRequestDto: UploadFileRequestDto,
) => {
  const instance = plainToInstance(UploadFileRequestDto, uploadFileRequestDto);
  const errors = validateSync(instance);

  if (errors.length) throw errorsMapper(errors);

  return;
};
