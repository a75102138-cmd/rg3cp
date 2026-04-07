-- Cascade delete policy: ownership hierarchy (see schema comments).
-- Actor / Material: remain SET NULL where referenced.

-- Zone hierarchy: deleting parent zone deletes child zones
ALTER TABLE "Zone" DROP CONSTRAINT IF EXISTS "Zone_parentZoneId_fkey";
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_parentZoneId_fkey"
  FOREIGN KEY ("parentZoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Element -> Observation
ALTER TABLE "Observation" DROP CONSTRAINT IF EXISTS "Observation_elementId_fkey";
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_elementId_fkey"
  FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Observation -> Pathology
ALTER TABLE "Pathology" DROP CONSTRAINT IF EXISTS "Pathology_observationId_fkey";
ALTER TABLE "Pathology" ADD CONSTRAINT "Pathology_observationId_fkey"
  FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Observation -> Decision (decisions tied to this observation only)
ALTER TABLE "Decision" DROP CONSTRAINT IF EXISTS "Decision_observationId_fkey";
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_observationId_fkey"
  FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Document: project / zone / observation / pathology / decision / intervention / logbook
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_projectId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_zoneId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_zoneId_fkey"
  FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_observationId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_observationId_fkey"
  FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_pathologyId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_pathologyId_fkey"
  FOREIGN KEY ("pathologyId") REFERENCES "Pathology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_decisionId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_decisionId_fkey"
  FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_interventionId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_interventionId_fkey"
  FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_logbookId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_logbookId_fkey"
  FOREIGN KEY ("logbookId") REFERENCES "Logbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Photo: project / zone / element / observation / pathology / intervention / logbook
ALTER TABLE "Photo" DROP CONSTRAINT IF EXISTS "Photo_projectId_fkey";
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" DROP CONSTRAINT IF EXISTS "Photo_zoneId_fkey";
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_zoneId_fkey"
  FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" DROP CONSTRAINT IF EXISTS "Photo_elementId_fkey";
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_elementId_fkey"
  FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" DROP CONSTRAINT IF EXISTS "Photo_observationId_fkey";
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_observationId_fkey"
  FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" DROP CONSTRAINT IF EXISTS "Photo_pathologyId_fkey";
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_pathologyId_fkey"
  FOREIGN KEY ("pathologyId") REFERENCES "Pathology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" DROP CONSTRAINT IF EXISTS "Photo_interventionId_fkey";
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_interventionId_fkey"
  FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" DROP CONSTRAINT IF EXISTS "Photo_logbookId_fkey";
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_logbookId_fkey"
  FOREIGN KEY ("logbookId") REFERENCES "Logbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Risk: project / zone / decision / intervention
ALTER TABLE "Risk" DROP CONSTRAINT IF EXISTS "Risk_projectId_fkey";
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Risk" DROP CONSTRAINT IF EXISTS "Risk_zoneId_fkey";
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_zoneId_fkey"
  FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Risk" DROP CONSTRAINT IF EXISTS "Risk_decisionId_fkey";
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_decisionId_fkey"
  FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Risk" DROP CONSTRAINT IF EXISTS "Risk_interventionId_fkey";
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_interventionId_fkey"
  FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
