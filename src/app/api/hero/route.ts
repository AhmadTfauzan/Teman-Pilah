import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function GET() {
  try {
    const data = await prisma.heroSlide.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return apiError("Unauthorized", 401);

    const body = await req.json();
    const item = await prisma.heroSlide.create({
      data: {
        imageUrl: body.imageUrl,
        altText: body.altText ?? null,
        caption: body.caption ?? null,
        linkUrl: body.linkUrl ?? null,
        linkLabel: body.linkLabel ?? null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });

    return apiSuccess(item, "Slide hero berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

