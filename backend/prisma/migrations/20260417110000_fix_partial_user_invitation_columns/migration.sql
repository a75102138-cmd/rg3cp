-- Idempotent hotfix for partially applied invitation schema.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountStatus') THEN
    CREATE TYPE "AccountStatus" AS ENUM ('INVITED', 'ACTIVE');
  END IF;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "inviteToken" TEXT,
  ADD COLUMN IF NOT EXISTS "inviteTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_inviteToken_key" ON "User"("inviteToken");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
