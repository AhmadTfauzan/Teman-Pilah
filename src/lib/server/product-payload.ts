import { Category, Prisma, StockLabel } from "@prisma/client";
import { AppError } from "./error";
import { assertSafeImageDataUrl, uploadedFileToDataUrl } from "./form-payload";

export interface ParsedProductPayload {
  productCode?: string;
  name?: string;
  category?: Category;
  description?: string | null;
  image?: string | null;
  price?: number;
  priceUnit?: string | null;
  stock?: number;
  stockLabel?: StockLabel;
  whatsappLink?: string | null;
}

const VALID_CATEGORIES = new Set<string>(Object.values(Category));
const VALID_STOCK_LABELS = new Set<string>(Object.values(StockLabel));
const MAX_PRODUCT_IMAGE_BYTES = 2 * 1024 * 1024;

function parseCategory(value: unknown): Category {
  if (typeof value !== "string" || !VALID_CATEGORIES.has(value.trim())) {
    throw new AppError(
      "Kategori produk tidak valid. Pilih: UPCYCLED_GOODS, ORGANIC, atau ZERO_WASTE",
      400
    );
  }
  return value.trim() as Category;
}

function parseStockLabel(value: unknown): StockLabel {
  if (typeof value !== "string" || !VALID_STOCK_LABELS.has(value.trim())) {
    throw new AppError(
      "Label stok tidak valid. Pilih: IN_STOCK, BULK_AVAILABLE, atau OUT_OF_STOCK",
      400
    );
  }
  return value.trim() as StockLabel;
}

function parsePrice(value: unknown): number {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value.trim())
        : NaN;

  if (!Number.isFinite(num) || num < 0) {
    throw new AppError("Harga produk harus berupa angka valid (>= 0)", 400);
  }
  return num;
}

function parseStock(value: unknown): number {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value.trim())
        : NaN;

  if (!Number.isInteger(num) || num < 0) {
    throw new AppError("Stok produk harus berupa bilangan bulat (>= 0)", 400);
  }
  return num;
}

function parseOptionalNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new AppError("Format teks tidak valid", 400);
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

async function fileToDataUrl(file: File): Promise<string> {
  return uploadedFileToDataUrl(file, MAX_PRODUCT_IMAGE_BYTES);
}

export async function parseProductPayload(req: Request): Promise<ParsedProductPayload> {
  const contentType = req.headers.get("content-type") || "";
  const result: ParsedProductPayload = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    if (formData.has("productCode")) {
      const val = formData.get("productCode");
      if (typeof val === "string" && val.trim() !== "") {
        result.productCode = val.trim().toUpperCase();
      }
    }

    if (formData.has("name")) {
      const val = formData.get("name");
      if (typeof val === "string") {
        result.name = val.trim();
      }
    }

    if (formData.has("category")) {
      result.category = parseCategory(formData.get("category"));
    }

    if (formData.has("description")) {
      result.description = parseOptionalNullableString(formData.get("description"));
    }

    if (formData.has("price")) {
      result.price = parsePrice(formData.get("price"));
    }

    if (formData.has("priceUnit")) {
      result.priceUnit = parseOptionalNullableString(formData.get("priceUnit"));
    }

    if (formData.has("stock")) {
      result.stock = parseStock(formData.get("stock"));
    }

    if (formData.has("stockLabel")) {
      result.stockLabel = parseStockLabel(formData.get("stockLabel"));
    }

    if (formData.has("whatsappLink")) {
      result.whatsappLink = parseOptionalNullableString(formData.get("whatsappLink"));
    }

    if (formData.has("image")) {
      const imageEntry = formData.get("image");
      if (imageEntry instanceof File) {
        if (imageEntry.size > 0) {
          result.image = await fileToDataUrl(imageEntry);
        }
      } else if (typeof imageEntry === "string" && imageEntry.trim() !== "") {
        result.image = assertSafeImageDataUrl(imageEntry.trim());
      }
    }

    return result;
  }

  const body = await req.json();
  if (!body || typeof body !== "object") {
    throw new AppError("Payload produk tidak valid", 400);
  }

  if (body.productCode !== undefined && body.productCode !== null && String(body.productCode).trim() !== "") {
    result.productCode = String(body.productCode).trim().toUpperCase();
  }
  if (body.name !== undefined) {
    if (typeof body.name !== "string") throw new AppError("Nama produk tidak valid", 400);
    result.name = body.name.trim();
  }
  if (body.category !== undefined) {
    result.category = parseCategory(body.category);
  }
  if (body.description !== undefined) {
    result.description = parseOptionalNullableString(body.description);
  }
  if (body.image !== undefined) {
    const parsedImage = parseOptionalNullableString(body.image);
    result.image = parsedImage ? assertSafeImageDataUrl(parsedImage) : null;
  }
  if (body.price !== undefined) {
    result.price = parsePrice(body.price);
  }
  if (body.priceUnit !== undefined) {
    result.priceUnit = parseOptionalNullableString(body.priceUnit);
  }
  if (body.stock !== undefined) {
    result.stock = parseStock(body.stock);
  }
  if (body.stockLabel !== undefined) {
    result.stockLabel = parseStockLabel(body.stockLabel);
  }
  if (body.whatsappLink !== undefined) {
    result.whatsappLink = parseOptionalNullableString(body.whatsappLink);
  }

  return result;
}

export function buildProductUpdateData(payload: ParsedProductPayload): Prisma.ProductUncheckedUpdateInput {
  const data: Prisma.ProductUncheckedUpdateInput = {};

  if (payload.productCode !== undefined) data.productCode = payload.productCode;
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.category !== undefined) data.category = payload.category;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.image !== undefined) data.image = payload.image;
  if (payload.price !== undefined) data.price = payload.price;
  if (payload.priceUnit !== undefined) data.priceUnit = payload.priceUnit;
  if (payload.stock !== undefined) data.stock = payload.stock;
  if (payload.stockLabel !== undefined) data.stockLabel = payload.stockLabel;
  if (payload.whatsappLink !== undefined) data.whatsappLink = payload.whatsappLink;

  return data;
}
