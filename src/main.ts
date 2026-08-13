import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const port = Number(process.env.GRPC_PORT ?? 50051);

  const logger = new Logger();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: `0.0.0.0:${port}`,
        package: 'files',
        protoPath: join(__dirname, 'proto', 'files', 'files_service.proto'),
      },
    },
  );
  app.enableShutdownHooks();

  await app.listen();
  logger.log(`App listening on port ${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
