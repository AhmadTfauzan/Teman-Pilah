import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parsePagination, buildPaginationMeta } from "@/lib/server/pagination";
import { apiPaginated, apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";
import slugify from "slug";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where: any = {};
    if (category && category !== "ALL") where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
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

    const body = await req.json();
    const slug = body.slug || `${slugify(body.title)}-${Date.now()}`;

    const news = await prisma.news.create({
      data: {
        title: body.title,
        slug,
        content: body.content,
        summary: body.summary ?? null,
        imageUrl: body.imageUrl ?? null,
        category: body.category || "Umum",
        authors: body.authors || ["Admin"],
        tags: body.tags || [],
        status: body.status || "PUBLISHED",
        visibility: body.visibility || "PUBLIC",
        publishDate: body.publishDate ? new Date(body.publishDate) : new Date(),
        partnership: body.partnership ?? null,
      },
    });

    return apiSuccess(news, "Berita berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
