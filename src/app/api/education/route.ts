import { ContentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parseEducationCreatePayload } from "@/lib/server/form-payload";
import { parsePagination, buildPaginationMeta } from "@/lib/server/pagination";
import { apiPaginated, apiSuccess, apiError } from "@/lib/server/response";
import { AppError, handleApiError } from "@/lib/server/error";

const VALID_CONTENT_STATUSES = new Set<string>(Object.values(ContentStatus));

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const statusParam = searchParams.get("status")?.trim();
    const { skip, take, page, limit } = parsePagination({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const where: Prisma.EducationContentWhereInput = {};
    if (statusParam) {
      const normalizedStatus = statusParam.toUpperCase();
      if (normalizedStatus !== "ALL") {
        if (!VALID_CONTENT_STATUSES.has(normalizedStatus)) {
          throw new AppError("Status konten edukasi tidak valid (PUBLISHED atau DRAFT)", 400);
        }
        where.status = normalizedStatus as ContentStatus;
      }
    }
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

    const data = await parseEducationCreatePayload(req);
    const item = await prisma.educationContent.create({ data });

    return apiSuccess(item, "Konten edukasi berhasil dibuat", 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new AppError("Slug konten edukasi sudah digunakan", 409));
    }
    return handleApiError(error);
  }
}

