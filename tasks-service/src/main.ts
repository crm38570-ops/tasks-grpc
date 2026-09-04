import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getMicroserviceOptions } from './microservice-options';

async function bootstrap() {
  const logger = new Logger('Bootstrap', { timestamp: true });

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice(getMicroserviceOptions(configService));
  app.enableShutdownHooks();

  await app.startAllMicroservices();
  await app.init();
  logger.log(
    `Application started: transport=grpc, address=0.0.0.0:${configService.get('GRPC_PORT')}`,
  );
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const logger = new Logger('Bootstrap', { timestamp: true });
  logger.error(`Application failed to start: ${message}`, stack);
  process.exit(1);
});
