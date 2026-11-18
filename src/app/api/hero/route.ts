import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parseHeroCreatePayload } from "@/lib/server/form-payload";
import { buildPaginationMeta, parsePagination } from "@/lib/server/pagination";
import { apiSuccess, apiPaginated, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wantsAll = searchParams.get("all") === "true";
    const user = wantsAll ? await authenticateRequest(req) : null;
    const includeInactive = wantsAll && Boolean(user);

    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where: Prisma.HeroSlideWhereInput = includeInactive ? {} : { isActive: true };

    const [data, total] = await Promise.all([
      prisma.heroSlide.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.heroSlide.count({ where }),
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

    const data = await parseHeroCreatePayload(req);
    const item = await prisma.heroSlide.create({ data });

    return apiSuccess(item, "Slide hero berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

