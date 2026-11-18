import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parseEcoEnzymeVideoCreatePayload } from "@/lib/server/form-payload";
import { parsePagination, buildPaginationMeta } from "@/lib/server/pagination";
import { apiPaginated, apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.trim();
    const platform = searchParams.get("platform")?.trim();
    const search = searchParams.get("search")?.trim();
    const rawIsActive = searchParams.get("isActive")?.trim().toLowerCase();
    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where: Prisma.EcoEnzymeVideoWhereInput = {};
    if (category && category !== "ALL") where.category = category;
    if (platform && platform.toUpperCase() !== "ALL") {
      where.platform = { equals: platform, mode: "insensitive" };
    }
    if (rawIsActive === "true" || rawIsActive === "1") {
      where.isActive = true;
    } else if (rawIsActive === "false" || rawIsActive === "0") {
      where.isActive = false;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.ecoEnzymeVideo.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
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

    const data = await parseEcoEnzymeVideoCreatePayload(req);
    const item = await prisma.ecoEnzymeVideo.create({ data });

    return apiSuccess(item, "Video Eco Enzyme berhasil ditambahkan", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

