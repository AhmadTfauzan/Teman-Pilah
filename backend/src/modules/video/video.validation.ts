import { z } from "zod";

export const createVideoSchema = z.object({
  title: z
    .string()
    .min(1, "Judul video wajib diisi")
    .max(255, "Judul maksimal 255 karakter")
    .trim(),
  videoUrl: z
    .string()
    .min(1, "Link video wajib diisi")
    .url("Format link video tidak valid")
    .max(500, "Link video maksimal 500 karakter")
    .trim(),
  platform: z
    .enum(["YouTube", "TikTok", "Instagram"])
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
    .optional(),
  sortOrder: z
    .coerce
    .number()
    .int()
    .optional()
    .default(0),
});

export const updateVideoSchema = createVideoSchema.partial();

export const videoQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, "Page harus berupa angka")
    .optional()
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit harus berupa angka")
    .optional()
    .default("20"),
  search: z
    .string()
    .max(100, "Keyword pencarian terlalu panjang")
    .trim()
    .optional(),
  platform: z
    .enum(["YouTube", "TikTok", "Instagram"])
    .optional(),
  category: z
    .string()
    .optional(),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
export type VideoQueryInput = z.infer<typeof videoQuerySchema>;

