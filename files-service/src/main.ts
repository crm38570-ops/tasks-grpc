import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { configValidationSchema } from './config.schema';

async function bootstrap() {
  const logger = new Logger();

  const { error } = configValidationSchema.validate(process.env, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    throw new Error(
      `Конфигурация не прошла валидацию: ${error.details
        .map((detail) => detail.message)
        .join('; ')}`,
    );
  }

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
  logger.log(`App listening on port ${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
