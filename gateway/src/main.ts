import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
  logger.log(`App listening on port 3000`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
