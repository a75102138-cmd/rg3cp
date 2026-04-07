import { registerAs } from '@nestjs/config';

/**
 * Swagger UI path is derived in main.ts from API prefix + docsPath.
 * Adjust here when you want a different docs URL segment.
 */
export default registerAs('swagger', () => ({
  docsPath: process.env.SWAGGER_DOCS_PATH ?? 'docs',
}));
