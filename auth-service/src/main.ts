import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { config } from './swagger-config';

async function bootstrap() {
  const logger = new Logger();
  const PORT = process.env.PORT ?? 3000;

  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const document = SwaggerModule.createDocument(app, config);

  if (process.env.STAGE !== 'prod') SwaggerModule.setup('api', app, document);

  await app.listen(PORT);
  logger.log(`App started on PORT: ${PORT}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
