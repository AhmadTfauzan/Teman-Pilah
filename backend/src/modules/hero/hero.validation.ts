import { z } from "zod";

const preprocessOptionalSortOrder = (val: unknown): unknown => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return undefined;
    const num = parseInt(trimmed, 10);
    return isNaN(num) ? val : num;
  }
  return val;
};

const preprocessOptionalIsActive = (val: unknown): unknown => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return undefined;
    if (trimmed === "true" || trimmed === "1") return true;
    if (trimmed === "false" || trimmed === "0") return false;
    return val;
  }
  return val;
};

const heroBaseSchema = z.object({
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
    .trim()
    .max(500, "Link URL maksimal 500 karakter")
    .refine(
      (val) => {
        if (val === "") return true;
        if (!/^https?:\/\//i.test(val)) return false;
        try {
          const parsed = new URL(val);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      "URL harus diawali http:// atau https://",
    )
    .optional(),

  linkLabel: z
    .string()
    .max(100, "Label link maksimal 100 karakter")
    .trim()
    .optional(),

  sortOrder: z
    .preprocess(preprocessOptionalSortOrder, z.number().int())
    .optional(),

  isActive: z
    .preprocess(preprocessOptionalIsActive, z.boolean())
    .optional(),
});

export const createHeroSchema = heroBaseSchema.extend({
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

export const updateHeroSchema = heroBaseSchema.partial();

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

