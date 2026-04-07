-- Idempotent : bases créées avant l’ajout de PhotoPhase / photoPhase (évite 500 sur GET …/observations/:id avec include photos).

DO $$ BEGIN
    CREATE TYPE "PhotoPhase" AS ENUM ('AVANT', 'PENDANT', 'APRES');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Photo" ADD COLUMN IF NOT EXISTS "photoPhase" "PhotoPhase";
