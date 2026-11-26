import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // 0. 프록시(Railway 엣지) 1단계를 신뢰 -> req.ip = 프록시가 X-Forwarded-For 끝에 붙인 실제 접속 IP
  //    없으면 req.ip가 프록시의 주소라, 요청 횟수 제한을 여러 사용자가 한 칸으로 나눠 쓴다
  //    1단계만 신뢰하므로 클라이언트가 X-Forwarded-For 앞쪽을 지어내도 무시된다
  app.set('trust proxy', 1);

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
