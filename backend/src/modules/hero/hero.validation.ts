import { z } from "zod";

export const createHeroSchema = z.object({
  altText: z
    .string()
    .max(255, "Alt text maksimal 255 karakter")
    .trim()
    .optional(),

  caption: z
    .string()
    .max(500, "Caption maksimal 500 karakter")
    .trim()
    .optional(),

  linkUrl: z
    .string()
    .max(500, "Link URL maksimal 500 karakter")
    .trim()
    .optional(),

  linkLabel: z
    .string()
    .max(100, "Label link maksimal 100 karakter")
    .trim()
    .optional(),

  sortOrder: z
    .preprocess((val) => {
      if (typeof val === "string" && val.trim() !== "") {
        const num = parseInt(val, 10);
        return isNaN(num) ? 0 : num;
      }
      if (typeof val === "number") return val;
      return 0;
    }, z.number().int())
    .optional()
    .default(0),

  isActive: z
    .preprocess((val) => {
      if (typeof val === "string") {
        return val === "true" || val === "1";
      }
      if (typeof val === "boolean") return val;
      return true;
    }, z.boolean())
    .optional()
    .default(true),
});

export const updateHeroSchema = createHeroSchema.partial();

export const heroQuerySchema = z.object({
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

  all: z
    .string()
    .optional(),
});

export type CreateHeroInput = z.infer<typeof createHeroSchema>;
export type UpdateHeroInput = z.infer<typeof updateHeroSchema>;
export type HeroQueryInput = z.infer<typeof heroQuerySchema>;

