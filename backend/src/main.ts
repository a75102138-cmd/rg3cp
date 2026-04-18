import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { getValidationPipeConfig } from './config/validation.config';

async function bootstrap(): Promise<void> {
  console.log('[bootstrap] Bootstrapping Nest application...');
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  console.log('[bootstrap] Nest application created');

  app.enableCors({
    origin: true,
    credentials: true,
  });
  console.log('[bootstrap] CORS enabled');
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));
  console.log('[bootstrap] Body parsers configured');

  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(new ValidationPipe(getValidationPipeConfig()));
  console.log(`[bootstrap] Global prefix set to /${apiPrefix}`);

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
  console.log(`[bootstrap] Swagger mounted at /${apiPrefix}/${docsSegment}`);

  const port = Number(config.get('app.port') ?? 3001);
  const finalPort = Number.isFinite(port) ? port : 3001;
  console.log(`[bootstrap] About to listen on 0.0.0.0:${finalPort}`);
  await app.listen(finalPort, '0.0.0.0');
  console.log(`[bootstrap] Nest application is listening on 0.0.0.0:${finalPort}`);
}

bootstrap().catch((err) => {
  console.error('[bootstrap] Bootstrap failed:', err);
  process.exit(1);
});
