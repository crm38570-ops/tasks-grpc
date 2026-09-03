import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { SignUpRequest } from '../../proto/auth/generated/auth_service';

export class AuthCredentialsDto implements SignUpRequest {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/[a-z]/, { message: 'username must contain a lowercase letter' })
  @Matches(/^[^.\n]+$/, {
    message: 'username must not contain dots or newlines',
  })
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(40)
  @Matches(/\d|\W/, {
    message: 'password must contain a digit or special character',
  })
  password: string;
}
