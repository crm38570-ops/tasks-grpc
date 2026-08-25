import { DocumentBuilder } from '@nestjs/swagger';

export const config = new DocumentBuilder()
  .setTitle('Auth API')
  .setDescription('Аутентификация и авторизация с JWT')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
