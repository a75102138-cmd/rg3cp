-- Move USER default reviewer link from Actor entity to ACTEUR user account
ALTER TABLE "User"
  ADD COLUMN "defaultValidatorUserId" UUID;

CREATE INDEX "User_defaultValidatorUserId_idx" ON "User"("defaultValidatorUserId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_defaultValidatorUserId_fkey"
  FOREIGN KEY ("defaultValidatorUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop previous actor-based reviewer link (replaced by user-account validator)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_defaultActorId_fkey";
DROP INDEX IF EXISTS "User_defaultActorId_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "defaultActorId";
