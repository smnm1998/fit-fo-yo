import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // 1. Secure Header
  app.use(helmet());

  // 2. Cookie Parser (HttpOnly JWT Cookie)
  app.use(cookieParser());

  // 3. CORS (BFF에서 credentials 동반 호출)
  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  app.enableCors({
    origin: corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  });

  // 4. 입력 검증 파이프 (DTO + class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 5. /api 글로벌 프리픽스
  app.setGlobalPrefix('api');

  // 6. Graceful shutdown (Prisma $disconnect 호출 보장)
  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  logger.log(`API ready on http://localhost:${port}/api`);
}

void bootstrap();
