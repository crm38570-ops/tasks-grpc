import { DocumentBuilder } from '@nestjs/swagger';

export const config = new DocumentBuilder()
  .setTitle('Task API')
  .setDescription('Менеджер задач с JWT авторизацией')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
