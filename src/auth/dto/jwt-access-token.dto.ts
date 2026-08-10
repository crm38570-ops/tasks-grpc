import { ApiProperty } from '@nestjs/swagger';
import { JwtAccessToken } from '../types/jwt-access-token.interface';

export class JwtAccessTokenDto implements JwtAccessToken {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Ik1hcnNpYW5pbiIsImlhdCI6MTc1MDAwMDAwMH0.signature',
    description: 'JWT-токен для авторизации',
  })
  accessToken: string;
}
