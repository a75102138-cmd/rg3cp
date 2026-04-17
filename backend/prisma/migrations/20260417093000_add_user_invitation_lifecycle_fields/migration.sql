-- Invitation lifecycle support for user accounts
CREATE TYPE "AccountStatus" AS ENUM ('INVITED', 'ACTIVE');

ALTER TABLE "User"
  ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "inviteToken" TEXT,
  ADD COLUMN "inviteTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "invitedAt" TIMESTAMP(3),
  ADD COLUMN "acceptedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");
CREATE INDEX "User_status_idx" ON "User"("status");
