import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parsePagination, buildPaginationMeta } from "@/lib/server/pagination";
import { apiPaginated, apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where: any = {};
    if (category && category !== "ALL") where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
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

    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        productCode: body.productCode || `PRD-${Date.now()}`,
        name: body.name,
        category: body.category,
        description: body.description ?? null,
        image: body.image ?? null,
        price: body.price,
        priceUnit: body.priceUnit ?? null,
        stock: body.stock ?? 0,
        stockLabel: body.stockLabel || "IN_STOCK",
        whatsappLink: body.whatsappLink ?? null,
      },
    });

    return apiSuccess(product, "Produk berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
