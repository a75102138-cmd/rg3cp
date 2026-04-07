import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryUploadService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryUploadService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const cloudName = this.config.get<string>('cloudinary.cloudName');
    const apiKey = this.config.get<string>('cloudinary.apiKey');
    const apiSecret = this.config.get<string>('cloudinary.apiSecret');
    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Variables Cloudinary manquantes (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) — les uploads échoueront.',
      );
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  /**
   * Upload image buffer vers un dossier Cloudinary (ex. projects/{code}/journal/photos).
   */
  async uploadImageBuffer(
    buffer: Buffer,
    mimetype: string,
    folder: string,
  ): Promise<{
    url: string;
    secure_url: string;
    public_id: string;
    bytes: number;
    format?: string;
    asset_folder?: string;
  }> {
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
    });
    return {
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes ?? buffer.length,
      format: result.format,
      asset_folder: result.asset_folder as string | undefined,
    };
  }

  /**
   * Upload fichier projet (PDF, Office, images…) vers un dossier Cloudinary donné.
   */
  async uploadDocumentBuffer(
    buffer: Buffer,
    mimetype: string,
    folder: string,
  ): Promise<{
    url: string;
    secure_url: string;
    public_id: string;
    bytes: number;
    format?: string;
    asset_folder?: string;
  }> {
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    });
    return {
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes ?? buffer.length,
      format: result.format,
      asset_folder: result.asset_folder as string | undefined,
    };
  }
}
