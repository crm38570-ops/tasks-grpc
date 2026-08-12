import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';

async function bootstrap() {
  const port = Number(process.env.GRPC_PORT ?? 50051);

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
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
