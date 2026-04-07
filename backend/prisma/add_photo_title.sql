-- Safe additive migration: add Photo.title if missing (Neon / DBs without Prisma migration history)
ALTER TABLE "Photo" ADD COLUMN IF NOT EXISTS "title" TEXT;
