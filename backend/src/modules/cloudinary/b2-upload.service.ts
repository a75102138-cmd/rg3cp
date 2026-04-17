import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class B2UploadService implements OnModuleInit {
  private readonly logger = new Logger(B2UploadService.name);
  private client: S3Client | null = null;
  private bucket = '';
  private publicBaseUrl = '';

  constructor(private readonly config: ConfigService) {}

  private normalizeEndpoint(raw: string): string {
    const trimmed = (raw || '').trim();
    if (!trimmed) return '';
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      return new URL(withProtocol).toString().replace(/\/$/, '');
    } catch {
      throw new Error(`B2_ENDPOINT invalide: "${raw}". Utilisez une URL complète (ex: https://s3.us-west-004.backblazeb2.com)`);
    }
  }

  private deriveRegionFromEndpoint(endpoint: string): string | null {
    try {
      const u = new URL(endpoint);
      const m = u.hostname.match(/^s3\.([a-z0-9-]+)\.backblazeb2\.com$/i);
      return m?.[1] ?? null;
    } catch {
      return null;
    }
  }

  onModuleInit(): void {
    const endpointRaw = (this.config.get<string>('b2.endpoint') ?? '').trim();
    const configuredRegion = (this.config.get<string>('b2.region') ?? '').trim();
    const keyId = (this.config.get<string>('b2.keyId') ?? '').trim();
    const applicationKey = (this.config.get<string>('b2.applicationKey') ?? '').trim();
    this.bucket = (this.config.get<string>('b2.bucket') ?? '').trim();
    this.publicBaseUrl = (this.config.get<string>('b2.publicBaseUrl') ?? '').replace(/\/$/, '');

    if (!endpointRaw || !keyId || !applicationKey || !this.bucket) {
      this.logger.warn(
        'Variables B2 manquantes (B2_ENDPOINT, B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET) — les uploads B2 échoueront.',
      );
      return;
    }
    const endpoint = this.normalizeEndpoint(endpointRaw);
    const endpointRegion = this.deriveRegionFromEndpoint(endpoint);
    const region = endpointRegion || configuredRegion || 'us-west-004';
    if (configuredRegion && endpointRegion && configuredRegion !== endpointRegion) {
      this.logger.warn(
        `B2 region mismatch: B2_REGION=${configuredRegion} but endpoint implies ${endpointRegion}. Using ${region}.`,
      );
    }

    try {
      this.client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId: keyId,
          secretAccessKey: applicationKey,
        },
        forcePathStyle: true,
        // Better compatibility with Backblaze B2 S3 API (avoid optional checksum/chunked quirks).
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
    } catch (e) {
      this.logger.error(`Échec init client B2: ${(e as Error).message}`);
      this.client = null;
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    mimeType: string,
    key: string,
  ): Promise<{
    url: string;
    secure_url: string;
    public_id: string;
    bytes: number;
    format?: string;
    asset_folder?: string;
  }> {
    if (!this.client || !this.bucket) {
      throw new Error('Backblaze B2 n’est pas configuré.');
    }
    const normalizedKey = key.replace(/^\/+|\/+$/g, '');
    const contentType = mimeType || 'application/octet-stream';
    if (buffer.length <= 10 * 1024 * 1024) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
          Body: buffer,
          ContentType: contentType,
          ContentLength: buffer.length,
        }),
      );
    } else {
      const uploader = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: normalizedKey,
          Body: buffer,
          ContentType: contentType,
        },
        queueSize: 2,
        partSize: 8 * 1024 * 1024,
        leavePartsOnError: false,
      });
      await uploader.done();
    }

    const ext = normalizedKey.includes('.') ? normalizedKey.split('.').pop() : undefined;
    const folder = normalizedKey.includes('/') ? normalizedKey.slice(0, normalizedKey.lastIndexOf('/')) : '';
    return {
      // Private bucket: persist non-public locator; access is via signed URL endpoint.
      url: `b2://${this.bucket}/${normalizedKey}`,
      secure_url: `b2://${this.bucket}/${normalizedKey}`,
      public_id: normalizedKey,
      bytes: buffer.length,
      format: ext,
      asset_folder: folder,
    };
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.client || !this.bucket) {
      throw new Error('Backblaze B2 n’est pas configuré.');
    }
    const normalizedKey = key.replace(/^\/+|\/+$/g, '');
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: normalizedKey,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }
}
