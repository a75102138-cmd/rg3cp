import { registerAs } from '@nestjs/config';

/**
 * Backblaze B2 (S3-compatible) settings for large document storage.
 */
export default registerAs('b2', () => ({
  endpoint: process.env.B2_ENDPOINT ?? '',
  region: process.env.B2_REGION ?? 'us-west-004',
  keyId: process.env.B2_KEY_ID ?? '',
  applicationKey: process.env.B2_APPLICATION_KEY ?? '',
  bucket: process.env.B2_BUCKET ?? '',
  publicBaseUrl: process.env.B2_PUBLIC_BASE_URL ?? '',
}));
