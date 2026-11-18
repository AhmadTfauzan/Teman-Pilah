import { z } from "zod";

const isValidHttpUrl = (val: string): boolean => {
  if (!/^https?:\/\//i.test(val)) return false;
  try {
    const parsed = new URL(val);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isSafeThumbnailUrl = (val: string | null): boolean => {
  if (!val) return true;
  const compact = val.replace(/[\u0000-\u0020]+/g, "");
  return !/^(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i.test(compact);
};

const preprocessOptionalIsActive = (val: unknown): unknown => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") {
    const trimmed = val.trim().toLowerCase();
    if (trimmed === "") return undefined;
    if (trimmed === "true" || trimmed === "1") return true;
    if (trimmed === "false" || trimmed === "0") return false;
    return val;
  }
  return val;
};

const tagsSchema = z.union([
  z
    .array(z.string().trim())
    .transform((items) => items.filter(Boolean)),
  z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
]);

const ecoEnzymeVideoBaseSchema = z.object({
  title: z
    .string()
    .min(1, "Judul video wajib diisi")
    .max(255, "Judul maksimal 255 karakter")
    .trim(),
  videoUrl: z
    .string()
    .trim()
    .min(1, "Link video wajib diisi")
    .max(500, "Link video maksimal 500 karakter")
    .refine(
      (val) =>
        (val.startsWith("/") &&
          !val.startsWith("//") &&
          !val.startsWith("/\\")) ||
        isValidHttpUrl(val),
      "URL harus diawali http:// atau https://, atau path lokal diawali / tunggal (misal /videos/...)",
    ),
  platform: z
    .enum(["YouTube", "TikTok", "Instagram", "Local"])
    .optional(),
  thumbnail: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .refine((val) => isSafeThumbnailUrl(val), "URL thumbnail tidak aman")
    .optional(),
  duration: z
    .string()
    .max(50, "Durasi maksimal 50 karakter")
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .trim()
    .optional(),
  category: z
    .string()
    .max(100, "Kategori maksimal 100 karakter")
    .trim()
    .optional(),
  aspect: z
    .enum(["wide", "tall"])
    .optional(),
  tags: tagsSchema.optional(),
  isActive: z
    .preprocess(preprocessOptionalIsActive, z.boolean())
    .optional(),
  sortOrder: z
    .coerce
    .number()
    .int()
    .optional(),
});

export const createEcoEnzymeVideoSchema = ecoEnzymeVideoBaseSchema.extend({
  aspect: z
    .enum(["wide", "tall"])
    .optional()
    .default("tall"),
  tags: tagsSchema.optional().default([]),
  isActive: z
    .preprocess(preprocessOptionalIsActive, z.boolean())
    .optional()
    .default(true),
  sortOrder: z
    .coerce
    .number()
    .int()
    .optional()
    .default(0),
});

export const updateEcoEnzymeVideoSchema = ecoEnzymeVideoBaseSchema.partial();

export const ecoEnzymeVideoQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, "Page harus berupa angka")
    .optional()
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit harus berupa angka")
    .optional()
    .default("100"),
  search: z.string().trim().optional(),
  platform: z.string().trim().optional(),
  category: z.string().trim().optional(),
  isActive: z
    .preprocess(preprocessOptionalIsActive, z.boolean())
    .optional(),
});

export type CreateEcoEnzymeVideoInput = z.infer<typeof createEcoEnzymeVideoSchema>;
export type UpdateEcoEnzymeVideoInput = z.infer<typeof updateEcoEnzymeVideoSchema>;
export type EcoEnzymeVideoQueryInput = z.infer<typeof ecoEnzymeVideoQuerySchema>;

