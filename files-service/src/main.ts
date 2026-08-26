import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap', { timestamp: true });

  const port = Number(process.env.GRPC_PORT ?? 50051);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'files',
        protoPath: join(__dirname, 'proto', 'files', 'files_service.proto'),
        url: `0.0.0.0:${port}`,
        loader: {
          longs: Number,
        },
      },
    },
  );
  app.enableShutdownHooks();

  await app.listen();
  logger.log(`Application started: transport=grpc, address=0.0.0.0:${port}`);
}
bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const logger = new Logger('Bootstrap', { timestamp: true });
  logger.error(`Application failed to start: ${message}`, stack);
  process.exit(1);
});
