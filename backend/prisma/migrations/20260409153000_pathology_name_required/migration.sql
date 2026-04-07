-- Pathology business field: required name
ALTER TABLE "Pathology" ADD COLUMN IF NOT EXISTS "name" TEXT;

UPDATE "Pathology"
SET "name" = CASE "pathologyType"::text
  WHEN 'CRACKING' THEN 'Fissuration'
  WHEN 'MOISTURE' THEN 'Humidité'
  WHEN 'SALT_ATTACK' THEN 'Attaque des sels'
  WHEN 'DETACHMENT' THEN 'Décollement'
  WHEN 'BIOLOGICAL_GROWTH' THEN 'Développement biologique'
  WHEN 'MATERIAL_LOSS' THEN 'Perte de matière'
  WHEN 'DEFORMATION' THEN 'Déformation'
  WHEN 'CORROSION' THEN 'Corrosion'
  WHEN 'COATING_FAILURE' THEN 'Dégradation de revêtement'
  ELSE 'Pathologie'
END
WHERE "name" IS NULL OR TRIM("name") = '';

ALTER TABLE "Pathology" ALTER COLUMN "name" SET NOT NULL;
