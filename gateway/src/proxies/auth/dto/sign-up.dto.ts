import { IsString, Length } from 'class-validator';

export class SignUpDto {
  @IsString()
  @Length(2, 40)
  username: string;

  @IsString()
  @Length(8, 40)
  password: string;
}
