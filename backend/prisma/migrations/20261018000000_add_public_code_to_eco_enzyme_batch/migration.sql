-- AlterTable: Add publicCode as nullable first so existing rows can be backfilled
ALTER TABLE "EcoEnzymeBatch" ADD COLUMN IF NOT EXISTS "publicCode" TEXT;

-- Backfill: EE-<YYMM>-<6 chars> from MD5(id), mapped off ambiguous 0/1.
-- Deterministic per id so re-running the migration does not reshuffle codes.
UPDATE "EcoEnzymeBatch"
SET "publicCode" = 'EE-'
  || TO_CHAR("startDate", 'YYMM')
  || '-'
  || UPPER(TRANSLATE(SUBSTRING(MD5("id") FROM 1 FOR 6), '01', '23'))
WHERE "publicCode" IS NULL OR "publicCode" = '';

-- Resolve any remaining collisions (extremely rare) by appending a short unique suffix
UPDATE "EcoEnzymeBatch" b
SET "publicCode" = b."publicCode" || UPPER(SUBSTRING(MD5(b."id") FROM 7 FOR 2))
WHERE b."id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "publicCode" ORDER BY "id") AS rn
    FROM "EcoEnzymeBatch"
  ) d
  WHERE d.rn > 1
);

ALTER TABLE "EcoEnzymeBatch" ALTER COLUMN "publicCode" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "EcoEnzymeBatch_publicCode_key" ON "EcoEnzymeBatch"("publicCode");
