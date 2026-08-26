import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap', { timestamp: true });
  const port = Number(process.env.PORT ?? 3000);

  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true });

  await app.listen(port);
  logger.log(`Application started: transport=http, address=0.0.0.0:${port}`);
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const logger = new Logger('Bootstrap', { timestamp: true });
  logger.error(`Application failed to start: ${message}`, stack);
  process.exit(1);
});
