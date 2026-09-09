import { ApiProperty } from '@nestjs/swagger';

export class SignUpResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID пользователя',
  })
  id: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Alice',
  })
  username: string;
}

export class SignInResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}
