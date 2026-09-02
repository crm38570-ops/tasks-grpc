import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { config } from './swagger-config';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const logger = new Logger('Bootstrap', { timestamp: true });
  const port = Number(process.env.PORT ?? 3000);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigins = configService
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({ origin: corsOrigins });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.useBodyParser('json', {
    limit: '1mb',
  });
  app.useBodyParser('urlencoded', {
    limit: '1mb',
    extended: true,
  });

  const document = SwaggerModule.createDocument(app, config);
  if (process.env.STAGE !== 'prod') SwaggerModule.setup('api', app, document);

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
