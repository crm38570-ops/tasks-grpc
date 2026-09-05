import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class SignInDto {
  @IsString()
  @Length(2, 40)
  @ApiProperty({
    minLength: 2,
    maxLength: 40,
    description: 'Имя пользователя',
    example: 'Alice',
  })
  username: string;

  @IsString()
  @Length(8, 40)
  @ApiProperty({
    minLength: 8,
    maxLength: 40,
    description: 'Пароль',
    example: 'Secret123!',
  })
  password: string;
}
