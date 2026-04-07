import { registerAs } from '@nestjs/config';

/**
 * Database URL for Prisma. Must match DATABASE_URL in .env.
 */
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));
