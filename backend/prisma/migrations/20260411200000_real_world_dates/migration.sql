-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "takenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "documentDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "eventDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Observation_observedAt_idx" ON "Observation"("observedAt");

-- CreateIndex
CREATE INDEX "Decision_decidedAt_idx" ON "Decision"("decidedAt");

-- CreateIndex
CREATE INDEX "Photo_takenAt_idx" ON "Photo"("takenAt");

-- CreateIndex
CREATE INDEX "Document_documentDate_idx" ON "Document"("documentDate");

-- CreateIndex
CREATE INDEX "Intervention_eventDate_idx" ON "Intervention"("eventDate");
