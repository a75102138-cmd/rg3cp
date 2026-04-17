-- Simplify platform roles to ADMIN / USER / ACTEUR.
-- Mapping from legacy roles:
-- SUPER_ADMIN, PROJECT_ADMIN -> ADMIN
-- VALIDATOR -> ACTEUR
-- UPLOADER, VIEWER -> USER

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'ACTEUR');

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole"
  USING (
    CASE
      WHEN "role"::text IN ('SUPER_ADMIN', 'PROJECT_ADMIN') THEN 'ADMIN'
      WHEN "role"::text = 'VALIDATOR' THEN 'ACTEUR'
      WHEN "role"::text IN ('UPLOADER', 'VIEWER') THEN 'USER'
      ELSE "role"::text
    END
  )::"UserRole";

DROP TYPE "UserRole_old";
