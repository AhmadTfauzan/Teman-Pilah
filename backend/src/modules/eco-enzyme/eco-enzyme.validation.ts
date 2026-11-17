import { z } from "zod";

export const createBatchSchema = z.object({
  batchCode: z.string().optional(),
  containerName: z.string().min(1, "Nama wadah/drum wajib diisi"),
  containerCapacityLiter: z.coerce.number().positive("Kapasitas wadah harus lebih dari 0").optional().default(50),
  molassesKg: z.coerce.number().positive("Berat gula/molase harus lebih dari 0"),
  organicWasteKg: z.coerce.number().positive("Berat sampah organik harus lebih dari 0"),
  waterLiter: z.coerce.number().positive("Volume air harus lebih dari 0"),
  organicWasteTypes: z.string().optional().default("Kulit Buah Campur"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  harvestEstimate: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  previousBatchId: z.string().nullable().optional(),
  // publicCode sengaja dihilangkan/dilarang agar tidak bisa ditentukan atau di-inject via API
});

export const updateBatchSchema = z.object({
  containerName: z.string().min(1).optional(),
  containerCapacityLiter: z.coerce.number().positive().optional(),
  molassesKg: z.coerce.number().positive().optional(),
  organicWasteKg: z.coerce.number().positive().optional(),
  waterLiter: z.coerce.number().positive().optional(),
  organicWasteTypes: z.string().optional(),
  startDate: z.string().optional(),
  harvestEstimate: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
  status: z.enum(["IN_PROGRESS", "HARVESTED", "FAILED"]).optional(),
  failureReason: z.enum(["KONTAMINASI_JAMUR_HITAM", "AROMA_BUSUK_MENYENGAT", "WADAH_BOCOR_RUSAK", "LAINNYA"]).nullable().optional(),
  failureNotes: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  // publicCode sengaja dilarang agar tidak dapat diubah pada operasi update
});

export const harvestBatchSchema = z.object({
  actualHarvestDate: z.string().optional(),
  harvestLiter: z.coerce.number().positive("Hasil panen harus lebih dari 0 liter"),
  residueUsage: z.enum(["KOMPOS_PADAT", "PUPUK_ORGANIK", "STARTER_BATCH_BARU", "PENGHARUM_TOILET"]).optional(),
  residueNotes: z.string().nullable().optional(),
  allocatedProductId: z.string().nullable().optional(),
  allocatedUnitsAdded: z.coerce.number().int().nonnegative().optional().default(0),
  notes: z.string().nullable().optional(),
});

export const createLogSchema = z.object({
  dayNumber: z.coerce.number().int().positive().optional().default(7),
  logDate: z.string().optional(),
  phLevel: z.coerce.number().min(0).max(14).nullable().optional(),
  aromaStatus: z.string().nullable().optional(),
  fungusColor: z.string().nullable().optional(),
  actionTaken: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const batchQuerySchema = z.object({
  status: z.enum(["ALL", "IN_PROGRESS", "FERMENTING", "READY_TO_HARVEST", "HARVESTED", "FAILED", "ARCHIVED"]).optional(),
  search: z.string().optional(),
  includeArchived: z
    .preprocess((val) => val === "true" || val === true || val === "1", z.boolean())
    .optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const publicCodeParamSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Kode batch publik tidak valid")
    .max(50, "Kode batch publik tidak valid")
    .regex(/^[a-zA-Z0-9\-_ \.\/]+$/, "Format kode batch publik tidak valid"),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type HarvestBatchInput = z.infer<typeof harvestBatchSchema>;
export type CreateLogInput = z.infer<typeof createLogSchema>;
export type BatchQueryInput = z.infer<typeof batchQuerySchema>;
export type PublicCodeParamInput = z.infer<typeof publicCodeParamSchema>;
