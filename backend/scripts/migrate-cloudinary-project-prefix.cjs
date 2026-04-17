/**
 * One-time migration: rename Cloudinary assets from legacy
 *   project/{projectUuid}/...
 * to
 *   rg3cp/{projectCode}/...
 *
 * Prérequis: CLOUDINARY_* dans .env (comme l’API).
 *
 * Usage:
 *   node scripts/migrate-cloudinary-project-prefix.cjs --dry-run
 *   node scripts/migrate-cloudinary-project-prefix.cjs
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

const DRY = process.argv.includes('--dry-run');

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET');
    process.exit(1);
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

/** @param {string} projectId @param {string} projectCode @param {string | null} bddCategory @param {string} publicId */
function mapDocumentPublicId(projectId, projectCode, bddCategory, publicId) {
  const pfx = `project/${projectId}/`;
  if (!publicId.startsWith(pfx)) return null;
  const rest = publicId.slice(pfx.length);
  if (rest.startsWith('documents/')) {
    return `rg3cp/${projectCode}/${rest}`;
  }
  if (rest.startsWith('logbook/')) {
    return `rg3cp/${projectCode}/journal/${rest.slice('logbook/'.length)}`;
  }
  if (rest.startsWith('risques/')) {
    const b = (bddCategory && bddCategory.trim()) || 'BDD_SECURITE';
    return `rg3cp/${projectCode}/documents/${b}/${rest.slice('risques/'.length)}`;
  }
  if (rest.startsWith('essais/')) {
    const tail = rest.slice('essais/'.length).split('/');
    const fi = tail.indexOf('file');
    if (fi >= 0 && fi < tail.length - 1) {
      tail.splice(fi, 1);
    }
    return `rg3cp/${projectCode}/essais/${tail.join('/')}`;
  }
  return null;
}

/** @param {string} projectId @param {string} projectCode @param {string} publicId @param {Map<string,string>} zoneIdToCode */
function mapPhotoPublicId(projectId, projectCode, publicId, zoneIdToCode) {
  const pfx = `project/${projectId}/`;
  if (!publicId.startsWith(pfx)) return null;
  const rest = publicId.slice(pfx.length);
  if (rest.startsWith('media/')) {
    return `rg3cp/${projectCode}/${rest}`;
  }
  const m = rest.match(/^zones\/([0-9a-f-]{36})\/(.*)$/i);
  if (m) {
    const zc = zoneIdToCode.get(m[1]);
    if (!zc) return null;
    return `rg3cp/${projectCode}/zones/${zc}/${m[2]}`;
  }
  return null;
}

async function main() {
  configureCloudinary();
  const prisma = new PrismaClient();
  try {
    const zones = await prisma.zone.findMany({ select: { id: true, code: true } });
    const zoneIdToCode = new Map(zones.map((z) => [z.id, z.code]));

    const docs = await prisma.document.findMany({
      where: { publicId: { startsWith: 'project/' } },
      include: { project: { select: { id: true, code: true } } },
    });

    let docOk = 0;
    let docSkip = 0;
    for (const d of docs) {
      if (!d.project) {
        docSkip++;
        continue;
      }
      const next = mapDocumentPublicId(
        d.project.id,
        d.project.code,
        d.bddCategory,
        d.publicId,
      );
      if (!next || next === d.publicId) {
        console.warn('[document] skip (unmapped)', d.id, d.publicId);
        docSkip++;
        continue;
      }
      if (DRY) {
        console.log('[document] DRY', d.publicId, '->', next);
        docOk++;
        continue;
      }
      try {
        const r = await cloudinary.uploader.rename(d.publicId, next, {
          invalidate: true,
          overwrite: false,
        });
        await prisma.document.update({
          where: { id: d.id },
          data: {
            publicId: r.public_id,
            url: r.url,
            secureUrl: r.secure_url,
            assetFolder: (r.asset_folder ?? next.split('/').slice(0, -1).join('/')).slice(0, 500),
          },
        });
        docOk++;
      } catch (e) {
        console.error('[document] rename failed', d.id, d.publicId, e.message || e);
        docSkip++;
      }
    }

    const photos = await prisma.photo.findMany({
      where: { publicId: { startsWith: 'project/' } },
      include: { project: { select: { id: true, code: true } } },
    });

    let photoOk = 0;
    let photoSkip = 0;
    for (const p of photos) {
      if (!p.project) {
        photoSkip++;
        continue;
      }
      const next = mapPhotoPublicId(p.project.id, p.project.code, p.publicId, zoneIdToCode);
      if (!next || next === p.publicId) {
        console.warn('[photo] skip (unmapped)', p.id, p.publicId);
        photoSkip++;
        continue;
      }
      if (DRY) {
        console.log('[photo] DRY', p.publicId, '->', next);
        photoOk++;
        continue;
      }
      try {
        const r = await cloudinary.uploader.rename(p.publicId, next, {
          invalidate: true,
          overwrite: false,
        });
        await prisma.photo.update({
          where: { id: p.id },
          data: {
            publicId: r.public_id,
            url: r.url,
            secureUrl: r.secure_url,
            assetFolder: (r.asset_folder ?? next.split('/').slice(0, -1).join('/')).slice(0, 500),
          },
        });
        photoOk++;
      } catch (e) {
        console.error('[photo] rename failed', p.id, p.publicId, e.message || e);
        photoSkip++;
      }
    }

    console.log(
      `Done. documents: ${docOk} ok, ${docSkip} skipped; photos: ${photoOk} ok, ${photoSkip} skipped. DRY=${DRY}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
