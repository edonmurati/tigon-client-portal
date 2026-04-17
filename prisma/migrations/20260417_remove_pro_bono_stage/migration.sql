-- Remove PRO_BONO from ClientStage enum
-- Safety: script verifies no Client still uses PRO_BONO before swapping the type.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Client" WHERE stage = 'PRO_BONO') THEN
    RAISE EXCEPTION 'Cannot drop PRO_BONO: Client rows still reference it';
  END IF;
END$$;

ALTER TYPE "ClientStage" RENAME TO "ClientStage_old";

CREATE TYPE "ClientStage" AS ENUM ('COLD', 'WARM', 'ACTIVE', 'PAUSED', 'ENDED');

ALTER TABLE "Client"
  ALTER COLUMN stage DROP DEFAULT,
  ALTER COLUMN stage TYPE "ClientStage" USING stage::text::"ClientStage",
  ALTER COLUMN stage SET DEFAULT 'WARM';

DROP TYPE "ClientStage_old";

COMMIT;
