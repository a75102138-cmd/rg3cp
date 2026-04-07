import { registerAs } from '@nestjs/config';

/**
 * Core HTTP / API settings. Loaded once via ConfigModule.
 */
export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  /**
   * API_PORT évite un PORT=3000 global (Windows / shell) qui ferait écouter Nest sur le même port que Next.
   * Sinon PORT, sinon 3001.
   */
  port: parseInt(process.env.API_PORT ?? process.env.PORT ?? '3001', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
}));
