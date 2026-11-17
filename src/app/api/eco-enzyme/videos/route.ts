import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parsePagination, buildPaginationMeta } from "@/lib/server/pagination";
import { apiPaginated, apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where: any = {};
    if (category && category !== "ALL") where.category = category;

    const [data, total] = await Promise.all([
      prisma.ecoEnzymeVideo.findMany({
        where,
        skip,
        take,
        orderBy: { sortOrder: "asc" },
      }),
      prisma.ecoEnzymeVideo.count({ where }),
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
    const item = await prisma.ecoEnzymeVideo.create({
      data: {
        title: body.title,
        videoUrl: body.videoUrl,
        platform: body.platform || "YouTube",
        thumbnail: body.thumbnail ?? null,
        duration: body.duration ?? null,
        description: body.description ?? null,
        category: body.category ?? null,
        aspect: body.aspect || "tall",
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return apiSuccess(item, "Video Eco Enzyme berhasil ditambahkan", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

