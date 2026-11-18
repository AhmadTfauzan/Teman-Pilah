import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { parseGalleryUpdatePayload } from "@/lib/server/form-payload";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError, AppError } from "@/lib/server/error";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.gallery.findUnique({ where: { id } });
    if (!item) throw new AppError("Galeri tidak ditemukan", 404);
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
    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) throw new AppError("Galeri tidak ditemukan", 404);

    const data = await parseGalleryUpdatePayload(req);
    const updated = await prisma.gallery.update({
      where: { id },
      data,
    });
    return apiSuccess(updated, "Galeri berhasil diupdate");
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
    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) throw new AppError("Galeri tidak ditemukan", 404);

    await prisma.gallery.delete({ where: { id } });
    return apiSuccess(null, "Galeri berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

