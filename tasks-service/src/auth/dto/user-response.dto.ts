import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'uuid v4',
  })
  id: string;

  @ApiProperty({
    example: 'Marsianin',
    description: 'Любой username от 2-х до 40 символов',
  })
  username: string;
}
