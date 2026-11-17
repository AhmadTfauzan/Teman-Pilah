-- AlterTable: add qrPrintedAt, previousBatchId, archivedAt safely
ALTER TABLE "EcoEnzymeBatch" ADD COLUMN IF NOT EXISTS "qrPrintedAt" TIMESTAMP(3);
ALTER TABLE "EcoEnzymeBatch" ADD COLUMN IF NOT EXISTS "previousBatchId" TEXT;
ALTER TABLE "EcoEnzymeBatch" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- AddForeignKey for succession
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EcoEnzymeBatch_previousBatchId_fkey'
  ) THEN
    ALTER TABLE "EcoEnzymeBatch" ADD CONSTRAINT "EcoEnzymeBatch_previousBatchId_fkey"
      FOREIGN KEY ("previousBatchId") REFERENCES "EcoEnzymeBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex for performance on filters
CREATE INDEX IF NOT EXISTS "EcoEnzymeBatch_archivedAt_idx" ON "EcoEnzymeBatch"("archivedAt");
CREATE INDEX IF NOT EXISTS "EcoEnzymeBatch_previousBatchId_idx" ON "EcoEnzymeBatch"("previousBatchId");
