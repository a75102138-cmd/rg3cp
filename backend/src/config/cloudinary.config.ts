import { registerAs } from '@nestjs/config';

/**
 * Cloudinary credentials — used later by upload services.
 * Path layout for assets is centralized in CloudinaryPathBuilderService.
 */
export default registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  apiKey: process.env.CLOUDINARY_API_KEY ?? '',
  apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
}));
