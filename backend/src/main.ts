import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { validationExceptionFactory } from './common/validation/validation-exception.factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuredOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isConfiguredOrigin = configuredOrigins.includes(origin);
      const isLocalDevOrigin =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

      if (isConfiguredOrigin || isLocalDevOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
