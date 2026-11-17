import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError, AppError } from "@/lib/server/error";

export async function GET(
  _req: Request,
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
    const body = await req.json();

    const updated = await prisma.news.update({
      where: { id },
      data: body,
    });
    return apiSuccess(updated, "Berita berhasil diupdate");
  } catch (error) {
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
    await prisma.news.delete({ where: { id } });
    return apiSuccess(null, "Berita berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

