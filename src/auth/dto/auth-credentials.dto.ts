import { IsString, Min } from 'class-validator';

export class AuthCredentialsDto {
  @IsString()
  @Min(2)
  username: string;

  @IsString()
  @Min(8)
  password: string;
}
