import { z } from "zod";

const videoBaseSchema = z.object({
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
    .url("Format link video tidak valid")
    .refine(
      (val) => /^https?:\/\//i.test(val),
      "URL harus diawali http:// atau https://",
    ),
  platform: z
    .enum(["YouTube", "TikTok", "Instagram"])
    .optional(),
  thumbnail: z
    .string()
    .trim()
    .max(500)
    .refine(
      (val) =>
        val === "" ||
        !/^(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i.test(
          val.replace(/[\u0000-\u0020]+/g, ""),
        ),
      "URL thumbnail tidak aman",
    )
    .nullable()
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
  date: z
    .string()
    .max(50, "Tanggal maksimal 50 karakter")
    .trim()
    .nullable()
    .optional(),
  sortOrder: z
    .coerce
    .number()
    .int()
    .optional(),
});

export const createVideoSchema = videoBaseSchema.extend({
  sortOrder: z
    .coerce
    .number()
    .int()
    .optional()
    .default(0),
});

export const updateVideoSchema = videoBaseSchema.partial();

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
    .string()
    .trim()
    .optional(),
  category: z
    .string()
    .optional(),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
export type VideoQueryInput = z.infer<typeof videoQuerySchema>;

