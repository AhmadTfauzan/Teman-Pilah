import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parseNewsUpdatePayload } from "@/lib/server/form-payload";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError, AppError } from "@/lib/server/error";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const news = await prisma.news.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });
    if (!news) throw new AppError("Berita tidak ditemukan", 404);
    if (news.status !== "PUBLISHED" || news.visibility === "PRIVATE") {
      const user = await authenticateRequest(req);
      if (!user) {
        throw new AppError("Berita tidak ditemukan", 404);
      }
    }
    return apiSuccess(news);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return apiError("Unauthorized", 401);

    const { id } = await params;
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) throw new AppError("Berita tidak ditemukan", 404);

    const data = await parseNewsUpdatePayload(req);
    const updated = await prisma.news.update({
      where: { id },
      data,
    });
    return apiSuccess(updated, "Berita berhasil diupdate");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new AppError("Slug berita sudah digunakan", 409));
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return apiError("Unauthorized", 401);

    const { id } = await params;
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) throw new AppError("Berita tidak ditemukan", 404);

    await prisma.news.delete({ where: { id } });
    return apiSuccess(null, "Berita berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

