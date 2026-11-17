import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/server/auth";
import { apiSuccess, apiError } from "@/lib/server/response";
import { handleApiError } from "@/lib/server/error";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return apiError("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.heroSlide.update({
      where: { id },
      data: body,
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
    await prisma.heroSlide.delete({ where: { id } });
    return apiSuccess(null, "Slide hero berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}
