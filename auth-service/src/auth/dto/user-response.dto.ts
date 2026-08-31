import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { SignUpResponse } from '../../proto/auth/generated/auth_service';

export class UserResponseDto implements SignUpResponse {
  @IsString()
  @IsUUID('4')
  id: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  username: string;
}
