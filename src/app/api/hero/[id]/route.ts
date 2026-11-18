import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parseHeroUpdatePayload } from "@/lib/server/form-payload";
import { apiSuccess, apiError } from "@/lib/server/response";
import { AppError, handleApiError } from "@/lib/server/error";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.heroSlide.findUnique({ where: { id } });
    if (!item) throw new AppError("Slide hero tidak ditemukan", 404);
    return apiSuccess(item);
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
    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) throw new AppError("Slide hero tidak ditemukan", 404);

    const data = await parseHeroUpdatePayload(req);
    const updated = await prisma.heroSlide.update({
      where: { id },
      data,
    });
    return apiSuccess(updated, "Slide hero berhasil diupdate");
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
    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) throw new AppError("Slide hero tidak ditemukan", 404);

    await prisma.heroSlide.delete({ where: { id } });
    return apiSuccess(null, "Slide hero berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

