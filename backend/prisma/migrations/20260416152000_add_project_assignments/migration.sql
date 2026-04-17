CREATE TABLE "ProjectUserAssignment" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProjectUserAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectActorAssignment" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProjectActorAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectUserAssignment_projectId_userId_key"
  ON "ProjectUserAssignment"("projectId", "userId");
CREATE INDEX "ProjectUserAssignment_projectId_idx"
  ON "ProjectUserAssignment"("projectId");
CREATE INDEX "ProjectUserAssignment_userId_idx"
  ON "ProjectUserAssignment"("userId");

CREATE UNIQUE INDEX "ProjectActorAssignment_projectId_actorId_key"
  ON "ProjectActorAssignment"("projectId", "actorId");
CREATE INDEX "ProjectActorAssignment_projectId_idx"
  ON "ProjectActorAssignment"("projectId");
CREATE INDEX "ProjectActorAssignment_actorId_idx"
  ON "ProjectActorAssignment"("actorId");

ALTER TABLE "ProjectUserAssignment"
  ADD CONSTRAINT "ProjectUserAssignment_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectUserAssignment"
  ADD CONSTRAINT "ProjectUserAssignment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectActorAssignment"
  ADD CONSTRAINT "ProjectActorAssignment_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectActorAssignment"
  ADD CONSTRAINT "ProjectActorAssignment_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "Actor"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
