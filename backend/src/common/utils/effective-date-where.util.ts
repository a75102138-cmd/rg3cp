import { Prisma } from '@prisma/client';

/** Filtre sur la date « métier » : takenAt si renseigné, sinon createdAt. */
export function wherePhotoEffectiveDateInRange(
  from: Date,
  to: Date,
): Prisma.PhotoWhereInput {
  return {
    OR: [
      {
        AND: [{ takenAt: { not: null } }, { takenAt: { gte: from, lte: to } }],
      },
      {
        AND: [{ takenAt: null }, { createdAt: { gte: from, lte: to } }],
      },
    ],
  };
}

/** Filtre sur la date « métier » : documentDate si renseigné, sinon createdAt. */
export function whereDocumentEffectiveDateInRange(
  from: Date,
  to: Date,
): Prisma.DocumentWhereInput {
  return {
    OR: [
      {
        AND: [
          { documentDate: { not: null } },
          { documentDate: { gte: from, lte: to } },
        ],
      },
      {
        AND: [{ documentDate: null }, { createdAt: { gte: from, lte: to } }],
      },
    ],
  };
}
