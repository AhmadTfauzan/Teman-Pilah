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
    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { overview: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.educationContent.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.educationContent.count({ where }),
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

    const item = await prisma.educationContent.create({
      data: {
        title: body.title,
        slug,
        overview: body.overview || "",
        description: body.description || "",
        thumbnail: body.thumbnail ?? null,
        tags: body.tags || [],
        status: body.status || "PUBLISHED",
        publishDate: body.publishDate ? new Date(body.publishDate) : new Date(),
      },
    });

    return apiSuccess(item, "Konten edukasi berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

