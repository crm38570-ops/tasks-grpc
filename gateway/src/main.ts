import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger();
  const PORT = Number(process.env.PORT ?? 3000);

  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true });

  await app.listen(PORT);
  logger.log(`App started on PORT: ${PORT}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
