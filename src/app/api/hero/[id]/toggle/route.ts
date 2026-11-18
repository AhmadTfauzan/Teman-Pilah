import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { AppError, handleApiError } from "@/lib/server/error";
import { apiError, apiSuccess } from "@/lib/server/response";

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

    const updated = await prisma.heroSlide.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return apiSuccess(
      updated,
      `Status slide berhasil diubah menjadi ${updated.isActive ? "Aktif" : "Nonaktif"}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
