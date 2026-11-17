import { z } from "zod";

export const createEcoEnzymeVideoSchema = z.object({
  title: z
    .string()
    .min(1, "Judul video wajib diisi")
    .max(255, "Judul maksimal 255 karakter")
    .trim(),
  videoUrl: z
    .string()
    .min(1, "Link video wajib diisi")
    .max(500, "Link video maksimal 500 karakter")
    .trim()
    .refine(
      (val) =>
        val.startsWith("/") ||
        val.startsWith("http://") ||
        val.startsWith("https://"),
      "Link video harus berupa URL valid (https://...) atau path video lokal (/videos/...)"
    ),
  platform: z
    .enum(["YouTube", "TikTok", "Instagram", "Local"])
    .optional(),
  thumbnail: z
    .string()
    .max(500)
    .trim()
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
    .optional()
    .default("tall"),
  sortOrder: z
    .coerce
    .number()
    .int()
    .optional()
    .default(0),
});

export const updateEcoEnzymeVideoSchema = createEcoEnzymeVideoSchema.partial();

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
});

export type CreateEcoEnzymeVideoInput = z.infer<typeof createEcoEnzymeVideoSchema>;
export type UpdateEcoEnzymeVideoInput = z.infer<typeof updateEcoEnzymeVideoSchema>;
export type EcoEnzymeVideoQueryInput = z.infer<typeof ecoEnzymeVideoQuerySchema>;

