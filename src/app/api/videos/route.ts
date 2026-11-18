import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parseBankSampahVideoCreatePayload } from "@/lib/server/form-payload";
import { parsePagination, buildPaginationMeta } from "@/lib/server/pagination";
import { apiPaginated, apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.trim();
    const platform = searchParams.get("platform")?.trim();
    const search = searchParams.get("search")?.trim();
    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where: Prisma.BankSampahVideoWhereInput = {};
    if (category && category !== "ALL") where.category = category;
    if (platform && platform.toUpperCase() !== "ALL") {
      where.platform = { equals: platform, mode: "insensitive" };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.bankSampahVideo.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.bankSampahVideo.count({ where }),
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

    const data = await parseBankSampahVideoCreatePayload(req);
    const item = await prisma.bankSampahVideo.create({ data });

    return apiSuccess(item, "Video berhasil ditambahkan", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

