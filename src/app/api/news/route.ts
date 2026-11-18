import { NewsStatus, NewsVisibility, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parseNewsCreatePayload } from "@/lib/server/form-payload";
import { parsePagination, buildPaginationMeta } from "@/lib/server/pagination";
import { apiPaginated, apiSuccess, apiError } from "@/lib/server/response";
import { AppError, handleApiError } from "@/lib/server/error";

const VALID_NEWS_STATUSES = new Set<string>(Object.values(NewsStatus));
const VALID_NEWS_VISIBILITIES = new Set<string>(Object.values(NewsVisibility));

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim();
    const status = searchParams.get("status")?.trim();
    const visibility = searchParams.get("visibility")?.trim();
    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where: Prisma.NewsWhereInput = {};
    if (category && category !== "ALL") where.category = category;
    if (status) {
      const normalizedStatus = status.toUpperCase();
      if (normalizedStatus !== "ALL") {
        if (!VALID_NEWS_STATUSES.has(normalizedStatus)) {
          throw new AppError("Status berita tidak valid (PUBLISHED, DRAFT, atau ARCHIVED)", 400);
        }
        where.status = normalizedStatus as NewsStatus;
      }
    }
    if (visibility) {
      const normalizedVisibility = visibility.toUpperCase();
      if (normalizedVisibility !== "ALL") {
        if (!VALID_NEWS_VISIBILITIES.has(normalizedVisibility)) {
          throw new AppError("Visibility berita tidak valid (PUBLIC atau PRIVATE)", 400);
        }
        where.visibility = normalizedVisibility as NewsVisibility;
      }
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.news.count({ where }),
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

    const data = await parseNewsCreatePayload(req);
    const news = await prisma.news.create({ data });

    return apiSuccess(news, "Berita berhasil dibuat", 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new AppError("Slug berita sudah digunakan", 409));
    }
    return handleApiError(error);
  }
}

