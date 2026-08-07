import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @ApiProperty({
    example: 'Marsianin',
    description: 'Любой username от 2-х до 40 символов',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/[A-Z]/, { message: 'username must contain an uppercase letter' })
  @Matches(/[a-z]/, { message: 'username must contain a lowercase letter' })
  @Matches(/^[^.\n]+$/, {
    message: 'username must not contain dots or newlines',
  })
  username: string;

  @ApiProperty({
    example: 'M@k@rony404!',
    description:
      'Любой пароль от 8 до 40 символов. Должен содержать цифру или символ',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(40)
  @Matches(/\d|\W/, {
    message: 'password must contain a digit or special character',
  })
  password: string;
}
