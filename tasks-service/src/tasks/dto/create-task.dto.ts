import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Написать дессертацию',
    description: 'Заголовок задачи',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example:
      'Основная тема - "Капибары, почему все мы их так любим?". Использовать ChatGPT 5.6 Sol для максимального погружения в тему',
    description: 'Заголовок задачи',
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}
