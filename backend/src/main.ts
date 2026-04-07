import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getValidationPipeConfig } from './config/validation.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  });

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
