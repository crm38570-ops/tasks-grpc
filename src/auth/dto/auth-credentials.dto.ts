import { IsString, Matches, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsString()
  @MinLength(2)
  @Matches(/[A-Z]/, { message: 'username must contain an uppercase letter' })
  @Matches(/[a-z]/, { message: 'username must contain a lowercase letter' })
  @Matches(/^[^.\n]+$/, {
    message: 'username must not contain dots or newlines',
  })
  username: string;

  @IsString()
  @MinLength(8)
  @Matches(/\d|\W/, {
    message: 'password must contain a digit or special character',
  })
  password: string;
}
