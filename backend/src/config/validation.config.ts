import type { ValidationPipeOptions } from '@nestjs/common';

/**
 * Shared ValidationPipe options (class-validator + class-transformer).
 * Used globally in main.ts so DTOs behave consistently.
 */
export function getValidationPipeConfig(): ValidationPipeOptions {
  return {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  };
}
