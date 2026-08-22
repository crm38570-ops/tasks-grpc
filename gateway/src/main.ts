import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
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

  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
  logger.log(`App listening on port 3000`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
