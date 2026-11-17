import { Category, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { AppError, handleApiError } from "@/lib/server/error";
import { buildPaginationMeta, parsePagination } from "@/lib/server/pagination";
import { parseProductPayload } from "@/lib/server/product-payload";
import { resolveOrCreateQrCode } from "@/lib/server/qr-code-service";
import { apiError, apiPaginated, apiSuccess } from "@/lib/server/response";

async function generateUniqueProductCode(category: Category): Promise<string> {
  const prefixMap: Record<Category, string> = {
    UPCYCLED_GOODS: "UP",
    ORGANIC: "OR",
    ZERO_WASTE: "ZW",
  };
  const prefix = prefixMap[category] || "GN";
  const count = await prisma.product.count({ where: { category } });

  for (let offset = 1; offset <= 15; offset++) {
    const candidate = `TP-${prefix}-${String(count + offset).padStart(3, "0")}`;
    const existing = await prisma.product.findUnique({ where: { productCode: candidate } });
    if (!existing) return candidate;
  }

  return `TP-${prefix}-${Date.now().toString(36).toUpperCase()}`;
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
      andConditions.push({ category: category as Category });
    }
    if (stockLabel && stockLabel !== "ALL") {
      andConditions.push({ stockLabel: stockLabel as Prisma.EnumStockLabelFilter<"Product"> });
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

    const productCode = payload.productCode || (await generateUniqueProductCode(payload.category));

    const existingByCode = await prisma.product.findUnique({ where: { productCode } });
    if (existingByCode) {
      throw new AppError(`Kode produk '${productCode}' sudah digunakan`, 409);
    }

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
    return handleApiError(error);
  }
}
