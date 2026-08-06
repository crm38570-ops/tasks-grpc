import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './interceptors';

async function bootstrap() {
  const logger = new Logger();
  const PORT = process.env.PORT ?? 3000;

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(PORT);
  logger.log(`App started on PORT: ${PORT}`);
}
bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
