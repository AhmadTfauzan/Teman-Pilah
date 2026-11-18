import crypto from "node:crypto";
import { Category, Prisma, StockLabel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { AppError, handleApiError } from "@/lib/server/error";
import { buildPaginationMeta, parsePagination } from "@/lib/server/pagination";
import { parseProductPayload } from "@/lib/server/product-payload";
import { resolveOrCreateQrCode } from "@/lib/server/qr-code-service";
import { apiError, apiPaginated, apiSuccess } from "@/lib/server/response";

const VALID_CATEGORIES = new Set<string>(Object.values(Category));
const VALID_STOCK_LABELS = new Set<string>(Object.values(StockLabel));
const MAX_PRODUCT_CODE_RETRIES = 5;

async function generateUniqueProductCode(category: Category, attempt: number = 0): Promise<string> {
  const prefixMap: Record<Category, string> = {
    UPCYCLED_GOODS: "UP",
    ORGANIC: "OR",
    ZERO_WASTE: "ZW",
  };
  const prefix = prefixMap[category] || "GN";

  if (attempt < 3) {
    const count = await prisma.product.count({ where: { category } });

    for (let offset = 1 + attempt; offset <= 15 + attempt; offset++) {
      const candidate = `TP-${prefix}-${String(count + offset).padStart(3, "0")}`;
      const existing = await prisma.product.findUnique({ where: { productCode: candidate } });
      if (!existing) return candidate;
    }
  }

  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TP-${prefix}-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim();
    const stockLabel = searchParams.get("stockLabel")?.trim();
    const codeParam = (searchParams.get("code") || searchParams.get("productCode"))?.trim();

    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const andConditions: Prisma.ProductWhereInput[] = [];
    if (category && category !== "ALL") {
      if (!VALID_CATEGORIES.has(category)) {
        throw new AppError(
          "Kategori produk tidak valid. Pilih: UPCYCLED_GOODS, ORGANIC, atau ZERO_WASTE",
          400
        );
      }
      andConditions.push({ category: category as Category });
    }
    if (stockLabel && stockLabel !== "ALL") {
      if (!VALID_STOCK_LABELS.has(stockLabel)) {
        throw new AppError(
          "Label stok tidak valid. Pilih: IN_STOCK, BULK_AVAILABLE, atau OUT_OF_STOCK",
          400
        );
      }
      andConditions.push({ stockLabel: stockLabel as StockLabel });
    }
    if (codeParam) {
      andConditions.push({
        OR: [
          { id: codeParam },
          { productCode: { equals: codeParam, mode: "insensitive" } },
          { qrCode: { code: { equals: codeParam, mode: "insensitive" } } },
        ],
      });
    }
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { productCode: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { qrCode: { code: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    const where: Prisma.ProductWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { qrCode: true },
      }),
      prisma.product.count({ where }),
    ]);

    return apiPaginated(data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return apiError("Unauthorized", 401);

    const payload = await parseProductPayload(req);

    if (!payload.name) {
      throw new AppError("Nama produk wajib diisi", 400);
    }
    if (!payload.category) {
      throw new AppError("Kategori produk wajib diisi", 400);
    }
    if (payload.price === undefined) {
      throw new AppError("Harga produk wajib diisi", 400);
    }

    const hasCustomCode = Boolean(payload.productCode);

    for (let attempt = 0; attempt < MAX_PRODUCT_CODE_RETRIES; attempt++) {
      const productCode =
        payload.productCode || (await generateUniqueProductCode(payload.category, attempt));

      if (hasCustomCode) {
        const existingByCode = await prisma.product.findUnique({ where: { productCode } });
        if (existingByCode) {
          throw new AppError(`Kode produk '${productCode}' sudah digunakan`, 409);
        }
      }

      try {
        const { qrCode } = await resolveOrCreateQrCode({
          entityType: "PRODUCT",
          entityKey: productCode,
          entityName: payload.name,
          pathPrefix: "/p",
        });

        const product = await prisma.product.create({
          data: {
            productCode,
            name: payload.name,
            category: payload.category,
            description: payload.description ?? null,
            image: payload.image ?? null,
            price: payload.price,
            priceUnit: payload.priceUnit ?? null,
            stock: payload.stock ?? 0,
            stockLabel: payload.stockLabel ?? "IN_STOCK",
            whatsappLink: payload.whatsappLink ?? null,
            qrCodeId: qrCode.id,
          },
          include: { qrCode: true },
        });

        return apiSuccess(product, "Produk berhasil dibuat", 201);
      } catch (error) {
        const isUniqueConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

        if (isUniqueConflict) {
          if (hasCustomCode) {
            throw new AppError(`Kode produk '${productCode}' sudah digunakan`, 409);
          }
          if (attempt < MAX_PRODUCT_CODE_RETRIES - 1) {
            continue;
          }
        }
        throw error;
      }
    }

    throw new AppError("Gagal menghasilkan kode produk unik setelah beberapa percobaan", 409);
  } catch (error) {
    return handleApiError(error);
  }
}
