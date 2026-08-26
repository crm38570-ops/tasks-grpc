import { DocumentBuilder } from '@nestjs/swagger';

export const config = new DocumentBuilder()
  .setTitle('MCS API')
  .setDescription('Публичный HTTP API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
