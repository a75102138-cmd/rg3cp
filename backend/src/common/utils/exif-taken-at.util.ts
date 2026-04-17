import exifr from 'exifr';
import { sanitizeBusinessDate } from './business-date.util';

/**
 * Lit EXIF DateTimeOriginal (ou CreateDate / ModifyDate) depuis le buffer image.
 * Retourne null si absent ou invalide.
 */
export async function extractDateTimeOriginalFromImageBuffer(buffer: Buffer): Promise<Date | null> {
  try {
    const tags = await exifr.parse(buffer, {
      pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'],
    });
    if (!tags || typeof tags !== 'object') return null;
    const raw =
      (tags as { DateTimeOriginal?: unknown; CreateDate?: unknown; ModifyDate?: unknown })
        .DateTimeOriginal ??
      (tags as { CreateDate?: unknown }).CreateDate ??
      (tags as { ModifyDate?: unknown }).ModifyDate;
    if (raw == null) return null;
    const d = raw instanceof Date ? raw : new Date(String(raw));
    return sanitizeBusinessDate(d);
  } catch {
    return null;
  }
}
