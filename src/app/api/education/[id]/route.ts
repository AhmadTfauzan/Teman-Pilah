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
    const item = await prisma.educationContent.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!item) throw new AppError("Konten edukasi tidak ditemukan", 404);
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
    const body = await req.json();

    const updated = await prisma.educationContent.update({
      where: { id },
      data: body,
    });
    return apiSuccess(updated, "Konten edukasi berhasil diupdate");
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
    await prisma.educationContent.delete({ where: { id } });
    return apiSuccess(null, "Konten edukasi berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

