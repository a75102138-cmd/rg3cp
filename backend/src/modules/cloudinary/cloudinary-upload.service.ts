import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

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

  private normalizeUploadResult(result: any, fallbackBytes: number): {
    url: string;
    secure_url: string;
    public_id: string;
    bytes: number;
    format?: string;
    asset_folder?: string;
  } {
    const finalResult = Array.isArray(result)
      ? [...result].reverse().find((r) => r?.public_id || r?.secure_url || r?.url) ?? result[result.length - 1]
      : result;

    const secure_url = finalResult?.secure_url ?? finalResult?.url;
    const url = finalResult?.url ?? finalResult?.secure_url;
    const public_id = finalResult?.public_id;

    if (!secure_url || !url || !public_id) {
      throw new Error('Cloudinary upload succeeded but returned incomplete payload (url/public_id missing).');
    }

    return {
      url,
      secure_url,
      public_id,
      bytes: finalResult?.bytes ?? fallbackBytes,
      format: finalResult?.format,
      asset_folder: finalResult?.asset_folder as string | undefined,
    };
  }

  private async uploadBufferWithStream(
    buffer: Buffer,
    options: {
      folder: string;
      resource_type: 'image' | 'auto';
      use_filename: boolean;
      unique_filename: boolean;
    },
  ): Promise<{
    url: string;
    secure_url: string;
    public_id: string;
    bytes: number;
    format?: string;
    asset_folder?: string;
  }> {
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, uploaded) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(uploaded);
      });
      Readable.from(buffer).pipe(stream);
    });
    return this.normalizeUploadResult(result, buffer.length);
  }

  private async uploadLargeBufferWithChunkedStream(
    buffer: Buffer,
    options: {
      folder: string;
      resource_type: 'image' | 'auto';
      use_filename: boolean;
      unique_filename: boolean;
    },
  ): Promise<{
    url: string;
    secure_url: string;
    public_id: string;
    bytes: number;
    format?: string;
    asset_folder?: string;
  }> {
    const result = await new Promise<any>((resolve, reject) => {
      let settled = false;
      const stream = (cloudinary.uploader as any).upload_chunked_stream(
        {
          ...options,
          resource_type: options.resource_type === 'image' ? 'image' : 'raw',
          chunk_size: 20 * 1024 * 1024,
        },
        (error: unknown, uploaded: any) => {
          if (settled) return;
          if (error) {
            settled = true;
            reject(error);
            return;
          }
          const isFinal = uploaded?.done === true || Boolean(uploaded?.public_id);
          if (isFinal) {
            settled = true;
            resolve(uploaded);
          }
        },
      );
      Readable.from(buffer).pipe(stream);
    });
    return this.normalizeUploadResult(result, buffer.length);
  }

  /**
   * Upload image buffer vers un dossier Cloudinary (ex. rg3cp/{code}/journal/photos).
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
    return this.uploadBufferWithStream(buffer, {
      folder,
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
    });
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
    if (buffer.length > 100 * 1024 * 1024) {
      return this.uploadLargeBufferWithChunkedStream(buffer, {
        folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      });
    }
    return this.uploadBufferWithStream(buffer, {
      folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    });
  }
}
