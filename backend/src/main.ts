import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { getValidationPipeConfig } from './config/validation.config';

async function bootstrap(): Promise<void> {
  // #region agent log
  try {
    const rawDbUrl = process.env.DATABASE_URL ?? '';
    const dbInfo = rawDbUrl
      ? (() => {
          try {
            const parsed = new URL(rawDbUrl);
            return {
              protocol: parsed.protocol.replace(':', ''),
              host: parsed.hostname,
              port: parsed.port || null,
              database: parsed.pathname.replace('/', ''),
            };
          } catch {
            return { parseError: true };
          }
        })()
      : { missing: true };
    fetch('http://127.0.0.1:7723/ingest/1799121e-74eb-4090-a7d5-1dedde7c8faf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '50e417' },
      body: JSON.stringify({
        sessionId: '50e417',
        runId: 'pre-fix',
        hypothesisId: 'H2',
        location: 'backend/src/main.ts:bootstrap',
        message: 'Backend startup database target',
        data: dbInfo,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  } catch {}
  // #endregion
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));

  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(new ValidationPipe(getValidationPipeConfig()));

  const docsSegment = config.get<string>('swagger.docsPath', 'docs');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Patrimoine — chantier patrimonial')
    .setDescription(
      'API foundation for heritage restoration: projects, zones (pivot), traceability chain, logbook, media.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/${docsSegment}`, app, document);

  const port = Number(config.get('app.port') ?? 3001);
  await app.listen(Number.isFinite(port) ? port : 3001);
}

bootstrap();
