export const FERMENTATION_DAYS = 90;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Menghitung batas cutoff tanggal mulai (startDate) untuk status READY_TO_HARVEST.
 * Karena startDate dihitung sebagai Hari ke-1, Hari ke-90 tercapai setelah
 * (FERMENTATION_DAYS - 1) = 89 hari penuh berlalu.
 */
export function getReadyToHarvestCutoffDate(now: Date = new Date()): Date {
  return new Date(now.getTime() - (FERMENTATION_DAYS - 1) * MS_PER_DAY);
}

/**
 * Menghitung jumlah hari fermentasi yang telah berjalan (startDate = Hari ke-1).
 */
export function computeBatchDayPassed(
  startDate: Date | string,
  now: Date = new Date(),
): number {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  return Math.floor(diffTime / MS_PER_DAY) + 1;
}

/**
 * Menentukan apakah batch IN_PROGRESS sudah memasuki kondisi siap panen (READY_TO_HARVEST)
 * berdasarkan tanggal estimasi panen atau batas 90 hari sejak startDate.
 */
export function isBatchReadyToHarvest(
  startDate: Date | string,
  harvestEstimate: Date | string,
  now: Date = new Date(),
): boolean {
  const est =
    harvestEstimate instanceof Date
      ? harvestEstimate
      : new Date(harvestEstimate);
  return (
    now >= est || computeBatchDayPassed(startDate, now) >= FERMENTATION_DAYS
  );
}

const REDACTED_BATCH_FIELDS = [
  "notes",
  "failureReason",
  "failureNotes",
  "residueNotes",
  "efficiencyRatePercent",
  "allocatedProduct",
  "allocatedProductId",
  "allocatedUnitsAdded",
] as const;

const REDACTED_BATCH_LOG_FIELDS = ["actionTaken", "notes", "imageUrl"] as const;

/**
 * Menghapus field internal admin dari object batch Eco Enzyme (dan nested inspectionLogs)
 * saat diakses oleh pemanggil publik yang tidak terautentikasi admin.
 */
export function redactPublicEcoEnzymeBatch<T extends Record<string, unknown>>(
  batch: T,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...batch };
  for (const field of REDACTED_BATCH_FIELDS) {
    delete sanitized[field];
  }

  if (Array.isArray(sanitized.inspectionLogs)) {
    sanitized.inspectionLogs = sanitized.inspectionLogs.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const sanitizedLog: Record<string, unknown> = {
        ...(entry as Record<string, unknown>),
      };
      for (const logField of REDACTED_BATCH_LOG_FIELDS) {
        delete sanitizedLog[logField];
      }
      return sanitizedLog;
    });
  }

  return sanitized;
}
