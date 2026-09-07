import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Название задачи',
    example: 'Подготовить документацию',
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Описание задачи',
    example: 'Добавить примеры запросов в Swagger',
  })
  description: string;
}
