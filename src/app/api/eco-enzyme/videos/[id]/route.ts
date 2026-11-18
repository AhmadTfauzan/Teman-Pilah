import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parseVideoUpdatePayload } from "@/lib/server/form-payload";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError, AppError } from "@/lib/server/error";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await prisma.ecoEnzymeVideo.findUnique({ where: { id } });
    if (!video) throw new AppError("Video tidak ditemukan", 404);
    return apiSuccess(video);
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
    const existing = await prisma.ecoEnzymeVideo.findUnique({ where: { id } });
    if (!existing) throw new AppError("Video tidak ditemukan", 404);

    const data = await parseVideoUpdatePayload(req);
    const updated = await prisma.ecoEnzymeVideo.update({
      where: { id },
      data,
    });
    return apiSuccess(updated, "Video berhasil diupdate");
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
    const existing = await prisma.ecoEnzymeVideo.findUnique({ where: { id } });
    if (!existing) throw new AppError("Video tidak ditemukan", 404);

    await prisma.ecoEnzymeVideo.delete({ where: { id } });
    return apiSuccess(null, "Video berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

