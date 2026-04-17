import { BadRequestException } from '@nestjs/common';

const MIN_MS = Date.UTC(1800, 0, 1);
/** Tolérance horloge appareil / fuseau (~48h dans le futur). */
const FUTURE_TOLERANCE_MS = 48 * 60 * 60 * 1000;

export function assertBusinessDateRange(d: Date): void {
  const t = d.getTime();
  if (Number.isNaN(t)) {
    throw new BadRequestException('Date invalide');
  }
  if (t < MIN_MS) {
    throw new BadRequestException('Date trop ancienne');
  }
  if (t > Date.now() + FUTURE_TOLERANCE_MS) {
    throw new BadRequestException('Date trop éloignée dans le futur');
  }
}

/** Parse ISO string; throws BadRequestException if invalid or out of range. */
export function parseBusinessDateString(iso: string): Date {
  const d = new Date(iso);
  assertBusinessDateRange(d);
  return d;
}

/** Optional ISO → Date or undefined (empty / whitespace → undefined). */
export function parseOptionalBusinessDateString(iso: string | undefined | null): Date | undefined {
  if (iso === undefined || iso === null) return undefined;
  const s = typeof iso === 'string' ? iso.trim() : '';
  if (!s) return undefined;
  return parseBusinessDateString(s);
}

/** Sanitize parsed dates (EXIF) — returns null if invalid or out of range (no throw). */
export function sanitizeBusinessDate(d: Date): Date | null {
  const t = d.getTime();
  if (Number.isNaN(t)) return null;
  if (t < MIN_MS || t > Date.now() + FUTURE_TOLERANCE_MS) return null;
  return d;
}
