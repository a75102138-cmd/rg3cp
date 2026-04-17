-- Add default ACTEUR assignment on User
ALTER TABLE "User"
  ADD COLUMN "defaultActorId" UUID;

CREATE INDEX "User_defaultActorId_idx" ON "User"("defaultActorId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_defaultActorId_fkey"
  FOREIGN KEY ("defaultActorId") REFERENCES "Actor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
